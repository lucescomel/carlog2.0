<?php
/**
 * PHP Reverse Proxy — Carlog
 * Redirige les requêtes /api/* vers le backend Node.js sur 127.0.0.1:3001
 *
 * À placer dans : ~/public_html/carlog.lucescomel.fr/proxy.php
 * Ne jamais exposer ce fichier directement — uniquement appelé par .htaccess
 */

$BACKEND = 'http://127.0.0.1:3001';

// URI complète avec query string (ex: /api/vehicles?page=1)
$uri = $_SERVER['REQUEST_URI'];
$url = $BACKEND . $uri;

// ── Headers à transmettre ───────────────────────────────────────────────────
$skipRequestHeaders = ['host', 'connection', 'transfer-encoding', 'content-length'];
$requestHeaders     = [];

if (function_exists('getallheaders')) {
    foreach (getallheaders() as $name => $value) {
        if (in_array(strtolower($name), $skipRequestHeaders)) continue;
        $requestHeaders[] = "$name: $value";
    }
}

// ── Corps de la requête ─────────────────────────────────────────────────────
$method = $_SERVER['REQUEST_METHOD'];
$body   = in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])
          ? file_get_contents('php://input')
          : null;

// ── cURL ────────────────────────────────────────────────────────────────────
$ch = curl_init($url);

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER         => true,
    CURLOPT_CUSTOMREQUEST  => $method,
    CURLOPT_HTTPHEADER     => $requestHeaders,
    CURLOPT_POSTFIELDS     => $body,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_TIMEOUT        => 30,
    CURLOPT_CONNECTTIMEOUT => 5,
    // Pas de TLS entre localhost et Node
    CURLOPT_SSL_VERIFYHOST => false,
    CURLOPT_SSL_VERIFYPEER => false,
]);

$response   = curl_exec($ch);
$httpCode   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$curlError  = curl_error($ch);
curl_close($ch);

// ── Erreur cURL (backend inaccessible) ─────────────────────────────────────
if ($curlError || $response === false) {
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode([
        'error'  => 'Backend unavailable',
        'detail' => $curlError ?: 'curl returned false',
    ]);
    exit;
}

// ── Séparer headers / body de la réponse ───────────────────────────────────
$responseHeaders = substr($response, 0, $headerSize);
$responseBody    = substr($response, $headerSize);

// ── Transmettre le status HTTP ──────────────────────────────────────────────
http_response_code($httpCode);

// ── Transmettre les headers de réponse (sauf hop-by-hop) ───────────────────
$skipResponseHeaders = ['transfer-encoding', 'connection', 'keep-alive', 'server', 'content-length'];

foreach (explode("\r\n", $responseHeaders) as $header) {
    if (empty($header) || strpos($header, 'HTTP/') === 0) continue;

    $parts = explode(':', $header, 2);
    if (count($parts) < 2) continue;

    $headerName = strtolower(trim($parts[0]));
    if (in_array($headerName, $skipResponseHeaders)) continue;

    header($header, false);
}

// ── Émettre le corps ────────────────────────────────────────────────────────
echo $responseBody;
