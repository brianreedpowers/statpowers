<?php
$name=stripslashes($_GET['name']);
if (isset($_POST['name'])) {
	$name=$_POST['name'];
	$showurl=true;
}
if (isset($_POST['email'])) {
	$to = $_POST['email'];
	$message = "<html>
	<head>
		<title>Medal For You!</title>
	</head>
	<body>
		Somebody has sent you a medal!<br>
		<center>
		<img src=\"https://www.brianreedpowers.com/medalforyou/medal.php?name=".urlencode($name)."\"><br>
		<a href=\"https://www.brianreedpowers.com/medalforyou/?name=".urlencode($name)."\">
		Click here to see it!</a>
		</center>
		-MedalForYou
	</body>
</html>";
	$subject = "Medal For You!";
	$headers  = 'MIME-Version: 1.0' . "\r\n";
	$headers .= 'Content-type: text/html; charset=iso-8859-1' . "\r\n";	
	$headers .= 'From: medals@brianreedpowers.com' . "\r\n" .
			'Reply-To: no-reply@brianreedpowers.com' . "\r\n" .
			'X-Mailer: PHP/' . phpversion();
//	echo ("$to<br>\n$subject<br>\n$message<br>\n$headers<br>\n"); 
	$successfully_sent = mail($to, $subject, $message, $headers);

//	$successfully_sent = mail('brianreedpowers@gmail.com', $subject, $message, $headers);
	
}

?>
<html>
<head>
	<title>Medal For You!</title>
	<script type="text/javascript">
function generateURL(){
	var recipent=escape(document.genform.name.value);
	document.getElementById('URL').innerHTML='<a href="https://www.brianreedpowers.com/medalforyou/index.php?name='+recipent+'">https://www.brianreedpowers.com/medalforyou/index.php?name=' + recipent + '</a>';
	document.getElementById('urldiv').style.display="block";
}
function validateforms(){
	if (document.genform.name.value==''){
//		document.getElementById('genurlbtn').disabled=true;
//		document.getElementById('emailspan').style.display="none";
	} else {
//		document.getElementById('genurlbtn').disabled=false;
//		document.getElementById('emailspan').style.display="block";
	}
	if (document.genform.email.value==''){
		document.getElementById('emailmedal').disabled=true;
	} else {
		document.getElementById('emailmedal').disabled=false;
	}
}

	function updateImage(){
		var name=document.getElementById('name').value
		document.getElementById('medalImage').src="medal.php?name="+name		
	}
	</script>
	<link rel="icon" type="image/png" href="icon.png" />
</head>
<body>
<?
if (isset($successfully_sent)){
	if ($successfully_sent) echo ("Email sent successfully!"); 
	else echo ("<b style=\"color:red;\">There was a problem; the email was not sent.</b>");
}
?>
	<h2 style="text-align:center;">Medal For You!</h4>
	<center>
		<img src="medal.php?name=<?php echo $name; ?>" id='medalImage'>
		<form name="genform" style="margin-top:20px;" method="POST" action="index.php">
			Name: <input name="name" id='name' width="16" maxlength="16" value="" onkeyup="validateforms();generateURL();" onChange="updateImage()">
			<!--input type="button" id="genurlbtn" value="Generate URL" onClick="generateURL()"-->
			<div id="emailspan" style="display:block;">
				Email: <input name="email" width="16" value="" onkeyup="validateforms()">
				<input type="submit" id="emailmedal" value="Send Medal">
			</div>
		</form>
		<div id="urldiv" <?php if (!$showurl) echo "style=\"display:none;\"";?>>URL: <span id="URL" style="border:1px #C0C0C0 solid; padding-left:3px; padding-right:3px; background-color:#E0E0E0;"><?php if (isset($name)){
		echo ("<a href=\"https://www.brianreedpowers.com/medalforyou/index.php?name=".urlencode($name)."\">https://www.brianreedpowers.com/medalforyou/index.php?name=".urlencode($name)."</a>");
		
		
		}?></span>
		<i style="display:block; font-size:11px;">Copy and paste the URL into an email to send the medal!</i>
		</div>
		
		<div id="footer" style="margin-top:50px; font-size:11px; color:gray;">Copyright 2021 Brian Powers, All Rights Reserved</div>
	</center>
		<script type="text/javascript">
			validateforms();
		</script>
</body>
</html>