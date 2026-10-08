const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function removeSplashScreen(config) {
  config = withAndroidManifest(config, (config) => {
    const mainActivity = config.modResults.manifest.application[0].activity.find(
      (a) => a.$['android:name'] === '.MainActivity'
    );
    if (mainActivity && mainActivity.$['android:theme'] === '@style/Theme.App.SplashScreen') {
      mainActivity.$['android:theme'] = '@style/AppTheme';
    }
    return config;
  });

  config = withDangerousMod(config, [
    'android',
    (config) => {
      const root = config.modRequest.platformProjectRoot;
      const stylesPath = path.join(root, 'app', 'src', 'main', 'res', 'values', 'styles.xml');
      if (fs.existsSync(stylesPath)) {
        let contents = fs.readFileSync(stylesPath, 'utf-8');
        const before = contents;
        contents = contents.replace(
          /<style name="Theme\.App\.SplashScreen"[\s\S]*?<\/style>\s*/g,
          ''
        );
        if (contents !== before) {
          fs.writeFileSync(stylesPath, contents, 'utf-8');
          console.log('✅ Removed Theme.App.SplashScreen from styles.xml');
        }
      }
      return config;
    },
  ]);

  return config;
}

module.exports = removeSplashScreen;
