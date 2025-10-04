/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
module.exports = {
  appId: 'com.medextract.clinical',
  productName: 'MedExtract',
  copyright: 'Copyright © 2025 MedExtract',
  
  directories: {
    output: 'dist',
    buildResources: 'build'
  },
  
  files: [
    'dist-electron/**/*',
    'dist/**/*',
    'package.json'
  ],
  
  extraMetadata: {
    main: 'dist-electron/main.js'
  },

  // Windows configuration
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64', 'arm64']
      }
    ],
    icon: 'build/icon.ico',
    artifactName: '${productName}-${version}-Setup.${ext}'
  },
  
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    deleteAppDataOnUninstall: false,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'MedExtract',
    installerIcon: 'build/icon.ico',
    uninstallerIcon: 'build/icon.ico'
  },

  // macOS configuration
  mac: {
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64']
      }
    ],
    icon: 'build/icon.icns',
    category: 'public.app-category.medical',
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: 'build/entitlements.mac.plist',
    entitlementsInherit: 'build/entitlements.mac.plist',
    artifactName: '${productName}-${version}-${arch}.${ext}'
  },
  
  dmg: {
    contents: [
      {
        x: 130,
        y: 220
      },
      {
        x: 410,
        y: 220,
        type: 'link',
        path: '/Applications'
      }
    ],
    window: {
      width: 540,
      height: 380
    }
  },

  // Linux configuration
  linux: {
    target: [
      {
        target: 'AppImage',
        arch: ['x64', 'arm64']
      },
      {
        target: 'deb',
        arch: ['x64', 'arm64']
      }
    ],
    icon: 'build/icon.png',
    category: 'Science',
    synopsis: 'Clinical Data Extraction System',
    description: 'AI-powered clinical data extraction from medical literature PDFs',
    artifactName: '${productName}-${version}-${arch}.${ext}'
  },

  // Auto-update configuration (optional)
  publish: null, // Set to GitHub/S3/etc. when ready for auto-updates
  
  // Compression
  compression: 'normal',
  
  // File associations
  fileAssociations: [
    {
      ext: 'pdf',
      name: 'PDF Document',
      role: 'Viewer'
    }
  ],

  // Protocol
  protocols: [
    {
      name: 'medextract',
      schemes: ['medextract']
    }
  ]
};
