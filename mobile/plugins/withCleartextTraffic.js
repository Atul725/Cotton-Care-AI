const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin to ensure cleartext HTTP network traffic is permitted
 * on Android 9+ (API 28+).
 *
 * 1. Injects android:usesCleartextTraffic="true" into <application>.
 * 2. Injects android:networkSecurityConfig="@xml/network_security_config" into <application>.
 * 3. Creates res/xml/network_security_config.xml permitting cleartext traffic.
 */
module.exports = function withCleartextTraffic(config) {
  // 1. Inject application manifest attributes
  config = withAndroidManifest(config, (modConfig) => {
    const androidManifest = modConfig.modResults;
    if (androidManifest?.manifest?.application?.[0]?.$) {
      const app = androidManifest.manifest.application[0];
      app.$['android:usesCleartextTraffic'] = 'true';
      app.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    }
    return modConfig;
  });

  // 2. Generate network_security_config.xml in Android resources
  config = withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const resXmlDir = path.join(
        modConfig.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'xml'
      );
      try {
        fs.mkdirSync(resXmlDir, { recursive: true });
        const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
</network-security-config>
`;
        fs.writeFileSync(path.join(resXmlDir, 'network_security_config.xml'), xmlContent, 'utf8');
      } catch (err) {
        // Continue if android folder is not yet generated
      }
      return modConfig;
    },
  ]);

  return config;
};
