"""
Scheduled weather monitoring service using APScheduler.
Periodically fetches weather forecasts for registered farmers,
generates weather alerts (with deduplication & cooldown),
and dispatches push notifications to registered devices.
"""
import logging
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from backend.app.core.database import SessionLocal
from backend.app.models.farmer import FarmerUser
from backend.app.services.weather_service import fetch_weather, generate_alerts_from_forecast
from backend.app.services.notification_service import send_alert_notifications

logger = logging.getLogger("cottoncare_scheduler")

_scheduler: AsyncIOScheduler | None = None
_is_running = False

CHECK_INTERVAL_MINUTES = 30


async def check_weather_and_notify_job():
    """
    Scheduled job: inspects weather for all distinct farmer locations,
    evaluates thresholds, deduplicates alerts, and sends push notifications.
    """
    logger.info("Executing scheduled weather monitoring job at %s", datetime.utcnow().isoformat())
    db = SessionLocal()
    try:
        farmers = db.query(FarmerUser).all()
        if not farmers:
            logger.info("No registered farmers found for weather check.")
            return

        # Deduplicate by coordinates to avoid hammering Open-Meteo API
        coords_map: dict[tuple[float, float], list[FarmerUser]] = {}
        for f in farmers:
            lat = round(float(f.latitude or 19.8762), 4)
            lon = round(float(f.longitude or 75.3433), 4)
            coords_map.setdefault((lat, lon), []).append(f)

        logger.info("Checking weather for %d distinct location(s) across %d farmer(s)", len(coords_map), len(farmers))

        for (lat, lon), user_list in coords_map.items():
            try:
                weather_data = await fetch_weather(lat, lon)
            except Exception as e:
                logger.error("Failed to fetch weather for coordinates (%s, %s): %s", lat, lon, e)
                continue

            for farmer in user_list:
                loc_name = farmer.location_name or farmer.location or "Farm Location"
                try:
                    new_alerts = generate_alerts_from_forecast(
                        weather_data=weather_data,
                        user_id=farmer.identifier,
                        location_name=loc_name,
                        db=db
                    )
                    if new_alerts:
                        logger.info("Generated %d new alert(s) for farmer %s", len(new_alerts), farmer.identifier)
                        for alert in new_alerts:
                            await send_alert_notifications(alert, db)
                except Exception as ex:
                    logger.error("Error generating alerts for farmer %s: %s", farmer.identifier, ex)

    except Exception as e:
        logger.error("Error in scheduled weather check job: %s", e, exc_info=True)
    finally:
        db.close()


def start_weather_scheduler():
    """Start the APScheduler background job if not already running."""
    global _scheduler, _is_running
    if _is_running:
        logger.info("Weather scheduler is already active.")
        return

    import asyncio
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        logger.warning("No running asyncio event loop detected. Weather scheduler will only run inside an async server context.")
        return

    try:
        _scheduler = AsyncIOScheduler(event_loop=loop)
        _scheduler.add_job(
            check_weather_and_notify_job,
            trigger=IntervalTrigger(minutes=CHECK_INTERVAL_MINUTES),
            id="cottoncare_weather_monitor",
            name="CottonCare Weather & Rain Alert Monitor",
            replace_existing=True,
            misfire_grace_time=300
        )
        _scheduler.start()
        _is_running = True
        logger.info("CottonCare weather scheduler started. Checking every %d minutes.", CHECK_INTERVAL_MINUTES)
    except Exception as e:
        logger.error("Failed to start weather scheduler: %s", e)


def stop_weather_scheduler():
    """Stop the scheduler gracefully on application shutdown."""
    global _scheduler, _is_running
    if _scheduler and _is_running:
        try:
            _scheduler.shutdown(wait=False)
            logger.info("CottonCare weather scheduler stopped.")
        except Exception as e:
            logger.warning("Error shutting down scheduler: %s", e)
        finally:
            _is_running = False
