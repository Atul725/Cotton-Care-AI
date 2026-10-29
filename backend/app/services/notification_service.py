"""
Notification service: sends Expo push notifications to registered devices.

Uses the Expo Push API (https://exp.host/--/api/v2/push/send).
- No credentials needed for development with Expo Go.
- For standalone APKs, FCM credentials in eas.json are required.
- Documentation: https://docs.expo.dev/push-notifications/sending-notifications/
"""
import logging
import httpx
from datetime import datetime
from sqlalchemy.orm import Session

from backend.app.models.weather import DeviceToken, WeatherAlert

logger = logging.getLogger("cottoncare_notifications")

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
EXPO_PUSH_HEADERS = {
    "Accept": "application/json",
    "Accept-Encoding": "gzip, deflate",
    "Content-Type": "application/json",
}


async def send_expo_push(
    token: str,
    title: str,
    body: str,
    data: dict | None = None,
    channel_id: str = "weather-alerts",
) -> dict:
    """
    Send a single Expo push notification. Returns the API response dict.
    Raises httpx.HTTPError on network failure.
    """
    payload = {
        "to": token,
        "title": title,
        "body": body,
        "sound": "default",
        "channelId": channel_id,
        "data": data or {},
        "priority": "high",
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(EXPO_PUSH_URL, json=payload, headers=EXPO_PUSH_HEADERS)
        resp.raise_for_status()
        return resp.json()


async def send_alert_notifications(alert: WeatherAlert, db: Session) -> int:
    """
    Find all active device tokens for the alert's user and send push notification.
    Marks DeviceTokens as inactive on DeviceNotRegistered errors.
    Returns count of successfully sent notifications.
    """
    from backend.app.models.weather import NotificationPrefs

    # Check quiet hours
    prefs = db.query(NotificationPrefs).filter_by(user_identifier=alert.user_identifier).first()
    if prefs and prefs.push_enabled:
        now_hour = datetime.utcnow().hour + 5  # approximate IST offset
        qstart = prefs.quiet_hours_start
        qend = prefs.quiet_hours_end
        # Simple quiet-hour check (doesn't handle midnight wrap perfectly, acceptable for MVP)
        if qstart > qend:  # crosses midnight
            if now_hour >= qstart or now_hour < qend:
                logger.info("Quiet hours active for %s, skipping push", alert.user_identifier)
                return 0
        else:
            if qstart <= now_hour < qend:
                logger.info("Quiet hours active for %s, skipping push", alert.user_identifier)
                return 0
    elif prefs and not prefs.push_enabled:
        return 0

    tokens = db.query(DeviceToken).filter_by(
        user_identifier=alert.user_identifier, is_active=True
    ).all()

    if not tokens:
        return 0

    # Use language from preferences
    lang = (prefs.preferred_language if prefs else "English")
    if lang == "Marathi" and alert.title_mr:
        title = alert.title_mr
        body = alert.message_mr or alert.message_en
    else:
        title = alert.title_en
        body = alert.message_en

    sent = 0
    for token_rec in tokens:
        try:
            result = await send_expo_push(
                token=token_rec.expo_push_token,
                title=f"🌾 CottonCare: {title}",
                body=body,
                data={"alertId": alert.id, "alertType": alert.alert_type, "screen": "Weather"},
            )
            # Check for DeviceNotRegistered error in response
            if isinstance(result, dict) and result.get("data"):
                data_list = result["data"] if isinstance(result["data"], list) else [result["data"]]
                for item in data_list:
                    if item.get("status") == "error" and "DeviceNotRegistered" in item.get("message", ""):
                        token_rec.is_active = False
                        db.commit()
                        logger.warning("DeviceNotRegistered: deactivated token for %s", alert.user_identifier)
                        continue
            token_rec.last_seen_at = datetime.utcnow()
            db.commit()
            sent += 1
            logger.info("Push sent to %s (token …%s)", alert.user_identifier, token_rec.expo_push_token[-6:])
        except Exception as exc:
            logger.error("Failed to send push to %s: %s", token_rec.expo_push_token[-6:], exc)

    # Mark alert as notification sent
    if sent > 0:
        alert.notification_sent = True
        db.commit()

    return sent


def register_device_token(
    db: Session,
    user_identifier: str,
    expo_push_token: str,
    device_id: str | None = None,
    platform: str = "android",
) -> DeviceToken:
    """
    Register or update an Expo push token for a farmer device.
    Reactivates tokens that were previously deactivated.
    """
    existing = db.query(DeviceToken).filter_by(expo_push_token=expo_push_token).first()
    if existing:
        existing.user_identifier = user_identifier
        existing.is_active = True
        existing.last_seen_at = datetime.utcnow()
        existing.device_id = device_id
        db.commit()
        db.refresh(existing)
        return existing

    token_rec = DeviceToken(
        user_identifier=user_identifier,
        expo_push_token=expo_push_token,
        device_id=device_id,
        platform=platform,
        is_active=True,
    )
    db.add(token_rec)
    db.commit()
    db.refresh(token_rec)
    return token_rec
