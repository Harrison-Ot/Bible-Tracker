<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
        <meta name="theme-color" content="#315c45">
        <title>Offline reading - Bible Tracker</title>
        <script>
            try { const choice = localStorage.getItem('appearance') || 'system'; if (choice === 'dark' || (choice === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)) document.documentElement.classList.add('dark'); } catch {}
        </script>
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/offline-app.tsx'])
    </head>
    <body class="bg-background text-foreground font-sans antialiased">
        <div id="offline-app"></div>
        <noscript>Enable JavaScript to open chapters downloaded on this device.</noscript>
    </body>
</html>