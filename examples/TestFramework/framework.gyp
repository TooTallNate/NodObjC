{
  'targets': [
    {
      'target_name': 'test_framework',
      'product_name': 'Test Framework',
      'type': 'shared_library',
      'mac_bundle': 1,
      'link_settings': {
        'libraries': [
          '$(SDKROOT)/System/Library/Frameworks/Foundation.framework',
        ],
      },
      'sources': [
          'test.m'
      ],
      'libraries': [ '-lobjc' ],
      'mac_framework_headers': [
          'test.h'
      ],
      'xcode_settings': {
          'INFOPLIST_FILE': 'Info.plist'
        , 'GCC_DYNAMIC_NO_PIC': 'NO'
      }
    }
  ]
}
