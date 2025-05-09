  <script>
    const SERVICE_UUID = 0xee00;
    const WRITE_UUID = 0xff01;
    let writeChar = null;
    let device = null;
    let server = null;

    async function connectToESP32(auto = false) {
      try {
        document.getElementById('status').textContent = 'Łączenie z urządzeniem...';

        if (!auto || !device) {
          const savedName = localStorage.getItem('lastDeviceName');

          const options = savedName ? {
            filters: [{ name: savedName }],
            optionalServices: [SERVICE_UUID]
          } : {
            acceptAllDevices: true,
            optionalServices: [SERVICE_UUID]
          };

          device = await navigator.bluetooth.requestDevice(options);
          localStorage.setItem('lastDeviceName', device.name);
        }

        device.addEventListener('gattserverdisconnected', () => {
          document.getElementById('status').textContent = 'Urządzenie rozłączone';
          document.querySelectorAll('.command').forEach(btn => btn.disabled = true);
          document.getElementById('disconnect').disabled = true;
        });

        server = await device.gatt.connect();
        const service = await server.getPrimaryService(SERVICE_UUID);
        writeChar = await service.getCharacteristic(WRITE_UUID);

        document.querySelectorAll('.command').forEach(btn => btn.disabled = false);
        document.getElementById('disconnect').disabled = false;
        document.getElementById('status').textContent = `Połączono z ${device.name || 'ESP32'}`;
      } catch (err) {
        document.getElementById('status').textContent = 'Błąd połączenia: ' + err;
        console.error(err);
      }
    }

    function disconnectESP32() {
      if (device && device.gatt.connected) {
        device.gatt.disconnect();
        document.getElementById('status').textContent = 'Rozłączono';
        document.querySelectorAll('.command').forEach(btn => btn.disabled = true);
        document.getElementById('disconnect').disabled = true;
      }
    }

    async function sendCommand(cmd) {
      if (!writeChar) return;
      const encoder = new TextEncoder();
      await writeChar.writeValue(encoder.encode(cmd));
      document.getElementById('status').textContent = `Wysłano: "${cmd}"`;
    }

    document.getElementById('connect').addEventListener('click', () => connectToESP32());
    document.getElementById('disconnect').addEventListener('click', disconnectESP32);
    document.querySelectorAll('.command').forEach(btn =>
      btn.addEventListener('click', () => sendCommand(btn.dataset.cmd))
    );

    // Próba automatycznego połączenia po załadowaniu strony
    window.addEventListener('load', async () => {
      const savedName = localStorage.getItem('lastDeviceName');
      if (savedName) {
        try {
          await connectToESP32(true);
        } catch (err) {
          console.warn('Automatyczne połączenie nie powiodło się:', err);
        }
      }
    });
  </script>
