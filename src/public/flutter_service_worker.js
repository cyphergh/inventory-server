'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';

const RESOURCES = {"assets/AssetManifest.bin": "ce7779358dcc139575434f0d791d5cd6",
"assets/AssetManifest.bin.json": "dd2056dddc4c78b30483fd3cd300b9cc",
"assets/AssetManifest.json": "03a76d53aa3ec01a7c26833bc6393044",
"assets/assets/cert.pem": "ca65014378ecbee1346c404db34b0ac4",
"assets/assets/logo.png": "91fa87bf55e61cdf6cf1df2061304457",
"assets/assets/NotoSans-Regular.ttf": "28ffc9e17c88630d93bf3fe92a687d04",
"assets/FontManifest.json": "dc3d03800ccca4601324923c0b1d6d57",
"assets/fonts/MaterialIcons-Regular.otf": "60ec1037893f4fd34316302241a1626d",
"assets/NOTICES": "8fa12f6c9210c513334ecb9f1992c5d5",
"assets/packages/awesome_snackbar_content/assets/back.svg": "ba1c3aebba280f23f5509bd42dab958d",
"assets/packages/awesome_snackbar_content/assets/bubbles.svg": "1df6817bf509ee4e615fe821bc6dabd9",
"assets/packages/awesome_snackbar_content/assets/types/failure.svg": "cb9e759ee55687836e9c1f20480dd9c8",
"assets/packages/awesome_snackbar_content/assets/types/help.svg": "7fb350b5c30bde7deeb3160f591461ff",
"assets/packages/awesome_snackbar_content/assets/types/success.svg": "6e273a8f41cd45839b2e3a36747189ac",
"assets/packages/awesome_snackbar_content/assets/types/warning.svg": "cfcc5fcb570129febe890f2e117615e0",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "e986ebe42ef785b27164c36a9abc7818",
"assets/shaders/ink_sparkle.frag": "ecc85a2e95f5e9f53123dcaf8cb9b6ce",
"canvaskit/canvaskit.js": "66177750aff65a66cb07bb44b8c6422b",
"canvaskit/canvaskit.js.symbols": "48c83a2ce573d9692e8d970e288d75f7",
"canvaskit/canvaskit.wasm": "1f237a213d7370cf95f443d896176460",
"canvaskit/chromium/canvaskit.js": "671c6b4f8fcc199dcc551c7bb125f239",
"canvaskit/chromium/canvaskit.js.symbols": "a012ed99ccba193cf96bb2643003f6fc",
"canvaskit/chromium/canvaskit.wasm": "b1ac05b29c127d86df4bcfbf50dd902a",
"canvaskit/skwasm.js": "694fda5704053957c2594de355805228",
"canvaskit/skwasm.js.symbols": "262f4827a1317abb59d71d6c587a93e2",
"canvaskit/skwasm.wasm": "9f0c0c02b82a910d12ce0543ec130e60",
"canvaskit/skwasm.worker.js": "89990e8c92bcb123999aa81f7e203b1c",
"favicon.ico": "3620a3a273e20264e6e9f3280afc1ec8",
"favicon.png": "99f91eb62be78a2e6d45f0f67dcc476b",
"flutter.js": "f393d3c16b631f36852323de8e583132",
"flutter_bootstrap.js": "ac5c69b6a503ccbbd7213d0500bb9eea",
"icons/android-icon-144x144.png": "66576127566c67576e56619aeba1be09",
"icons/android-icon-192x192.png": "ad2400ec05d50f87c38c9818ed9f5f39",
"icons/android-icon-36x36.png": "c864cbe638160f046c6e9a43ab01fcb8",
"icons/android-icon-48x48.png": "b0525cc4c3856aacee28016234757bd2",
"icons/android-icon-72x72.png": "3e4113e64e4868ce08fc6dc6c43b876d",
"icons/android-icon-96x96.png": "39d0eff3597f6989deb6b8c2324da0db",
"icons/apple-icon-114x114.png": "5c74d25fdcef7267d71189163a08a0e3",
"icons/apple-icon-120x120.png": "73fcbba224f18829c828bac977c6ba3c",
"icons/apple-icon-144x144.png": "66576127566c67576e56619aeba1be09",
"icons/apple-icon-152x152.png": "f0d6123c0b19756fd3652736ee89e855",
"icons/apple-icon-180x180.png": "e1d0b85e0b4501468b92e0d24985a7ca",
"icons/apple-icon-57x57.png": "1cebc63df656ea16de8a501f27cffb55",
"icons/apple-icon-60x60.png": "c53907882ea8da68d8bceaeac60396de",
"icons/apple-icon-72x72.png": "3e4113e64e4868ce08fc6dc6c43b876d",
"icons/apple-icon-76x76.png": "f4a418ad591b45a80adb320eef35d607",
"icons/apple-icon-precomposed.png": "8fcc667b5430064c8c3d4a20cc6c4b34",
"icons/apple-icon.png": "8fcc667b5430064c8c3d4a20cc6c4b34",
"icons/favicon-16x16.png": "99f91eb62be78a2e6d45f0f67dcc476b",
"icons/favicon-32x32.png": "3f96d49b1f2b789e297301df67d79f9f",
"icons/favicon-96x96.png": "39d0eff3597f6989deb6b8c2324da0db",
"icons/ms-icon-144x144.png": "66576127566c67576e56619aeba1be09",
"icons/ms-icon-150x150.png": "3a1ee1543f12848962216ebe8d83af4a",
"icons/ms-icon-310x310.png": "65cef582d993a08b407c7d6b55a106e3",
"icons/ms-icon-70x70.png": "df8cf084e8a1299d53fc101f33c7ec85",
"index.html": "bbc8e8c2a7ff59ae3f2a387b8c3436c3",
"/": "bbc8e8c2a7ff59ae3f2a387b8c3436c3",
"main.dart.js": "3263c271c04e118622707622368228f0",
"manifest.json": "c438609842922804de590b43e1beea9f",
"version.json": "2b521e10dfa0f067561de489a19d6620"};
// The application shell files that are downloaded before a service worker can
// start.
const CORE = ["main.dart.js",
"index.html",
"flutter_bootstrap.js",
"assets/AssetManifest.bin.json",
"assets/FontManifest.json"];

// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});
// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        // Claim client to enable caching on first launch
        self.clients.claim();
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      // Claim client to enable caching on first launch
      self.clients.claim();
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});
// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache only if the resource was successfully fetched.
        return response || fetch(event.request).then((response) => {
          if (response && Boolean(response.ok)) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      })
    })
  );
});
self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});
// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}
// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
