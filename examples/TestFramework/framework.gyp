{
  'targets': [
    {
      'target_name': 'test_framework',
      'product_name': 'Test Framework',
      'type': 'shared_library',
      'mac_bundle': 1,
      'mac_framework_headers': [
          'test.h'
      ],
      'sources': [
          'test.m'
      ],
      'xcode_settings': {
          'INFOPLIST_FILE: 'Info.plist'
        , 'GCC_DYNAMIC_NO_PIC': 'NO'
      }
    }
  ]
}
