<?php
//gets the data from a URL
function get_tiny_url($url)  {
	$ch = curl_init();
	$timeout = 5; 
	curl_setopt($ch,CURLOPT_URL,'http://tinyurl.com/api-create.php?url='.urlencode($url));
	curl_setopt($ch,CURLOPT_RETURNTRANSFER,1);
	curl_setopt($ch,CURLOPT_CONNECTTIMEOUT,$timeout);
	$data = curl_exec($ch);
	curl_close($ch);
	return $data;
}
function tinyUrl($url){
    $tiny = 'http://tinyurl.com/api-create.php?url=';
    $tinyhandle = fopen($tiny.urlencode(trim($url)), "r");
    $tinyurl = fread($tinyhandle, 26);
    fclose($tinyhandle);
    return $tinyurl;
}
//test it out!
//$new_url = tinyUrl($_GET["url"]);
//echo $_GET["url"];
//echo urldecode($_GET["url"]);
//returns http://tinyurl.com/n48rbym
//echo $_GET["url"];
//echo $new_url;
//echo "  <br>";

//9U7U0RadIXKz6GtCeppldU2kJZT968PpoJwyZgb093CFuvmSxJc6dTvxTlXQ


echo"<html><body>"

$url = "https://api.tinyurl.com/create";
$getURL = $_GET["url"]

$curl = curl_init($url);
curl_setopt($curl, CURLOPT_URL, $url);
curl_setopt($curl, CURLOPT_POST, true);
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

$headers = array(
   "accept: application/json",
   "Content-Type: application/json",
   "Authorization: Bearer 9U7U0RadIXKz6GtCeppldU2kJZT968PpoJwyZgb093CFuvmSxJc6dTvxTlXQ",
);
curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);

$data = '{"url":"'.$getURL.'","domain":"tiny.one"}';
$data = '{"url":"https://www.statpowers.com","domain":"tiny.one"}';


curl_setopt($curl, CURLOPT_POSTFIELDS, $data);

//for debug only!
curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);

$resp = curl_exec($curl);
curl_close($curl);
var_dump($resp);

//echo get_tiny_url($url);
echo"</body></html>";
?>