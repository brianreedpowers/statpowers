var files = <?php $out = array();
foreach (glob($_SERVER['DOCUMENT_ROOT'].'/csv/*.csv') as $filename) {
    $p = pathinfo($filename);
    $out[] = $p['filename'];
}
echo json_encode($out); ?>;