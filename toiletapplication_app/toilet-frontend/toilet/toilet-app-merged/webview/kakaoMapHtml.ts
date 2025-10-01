export const kakaoMapHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Kakao Map</title>
  <style>
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; }
  </style>
  <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=e305950d640265b7607964545cf2aa75&autoload=false"></script>
</head>
<body>
  <div id="map"></div>
  <script>
    let map, userMarker, routeLine;
    let toiletMarkers = [];

    kakao.maps.load(() => {
      map = new kakao.maps.Map(document.getElementById('map'), {
        center: new kakao.maps.LatLng(37.5665, 126.9780),
        level: 4
      });
    });

    function clearToiletMarkers() {
      toiletMarkers.forEach(m => m.setMap(null));
      toiletMarkers = [];
    }

    function drawToiletMarkers(toilets) {
      clearToiletMarkers();
      (toilets || []).forEach(t => {
        const lat = t.lat ?? t.latitude;
        const lng = t.lng ?? t.longitude;
        if (!lat || !lng) return;

        // ✅ 커스텀 아이콘 + 크기 지정 (44x44)
        const imageSize = new kakao.maps.Size(44, 44);
        const markerImage = new kakao.maps.MarkerImage(
          "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png", // 원하는 아이콘 경로
          imageSize
        );

        const marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(lat, lng),
          map: map,
          title: t.name || '',
          image: markerImage,
          clickable: true
        });

        kakao.maps.event.addListener(marker, 'click', () => {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: 'marker_click', payload: t })
          );
        });
        toiletMarkers.push(marker);
      });
    }

    function updateUserMarker(lat, lng) {
      if (!map) return;
      const pos = new kakao.maps.LatLng(lat, lng);
      if (!userMarker) {
        userMarker = new kakao.maps.Marker({
          position: pos,
          map: map,
          image: new kakao.maps.MarkerImage(
            "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/red_b.png",
            new kakao.maps.Size(40, 40) // ✅ 기존 32→40
          )
        });
      } else {
        userMarker.setPosition(pos);
      }
    }
    
    function drawRoute(path) {
      const linePath = path.map(p => 
        new kakao.maps.LatLng(
          p.latitude ?? p.lat,
          p.longitude ?? p.lng
        )
      );
      if (routeLine) routeLine.setMap(null);
      routeLine = new kakao.maps.Polyline({
        path: linePath,
        strokeWeight: 5,
        strokeColor: '#007AFF',
        strokeOpacity: 0.9,
        strokeStyle: 'solid',
        map: map
      });
    }

    function clearRoute() {
      if (routeLine) routeLine.setMap(null);
      routeLine = null;
    }

    function moveToLocation(lat, lng) {
      if (!map) return;
      map.setCenter(new kakao.maps.LatLng(lat, lng));
    }

    function handleMessage(event) {
      const data = JSON.parse(event.data);
      if (!map) return;

      if (data.type === 'location_update') {
        updateUserMarker(data.latitude, data.longitude);
        moveToLocation(data.latitude, data.longitude);
        drawToiletMarkers(data.toilets);
      } else if (data.type === 'draw_route') {
        drawRoute(data.path);
      } else if (data.type === 'clear_route') {
        clearRoute();
      } else if (data.type === 'center_location') {
        moveToLocation(data.latitude, data.longitude);
      }
    }

    document.addEventListener('message', handleMessage); // Android
    window.addEventListener('message', handleMessage);   // iOS
  </script>
</body>
</html>`;
