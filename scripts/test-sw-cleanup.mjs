+// 10. Invalid pageHref URL input -> false (does not throw)
+assert.equal(
+  isShobdoRegistration({ scope: SHOBDO_SCOPE, active: { scriptURL: SHOBDO_SW } }, 'not-a-valid-url'),
+  false
+);
+assert.equal(
+  isShobdoRegistration({ scope: SHOBDO_SCOPE, active: { scriptURL: SHOBDO_SW } }, ''),
+  false
+);
+
-console.log('All 9 Service Worker cleanup tests passed!');
+console.log('All 10 Service Worker cleanup test groups passed!');
