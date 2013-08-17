
// let's go


// -----------------
// les fonctions :
//  download
//  init
//  login
//

// -----------   TEST AREA --------------
//url de test:
var url = "http://www.cpasbien.me/_torrents/a-la-merveille-to-the-wonder-french-dvdrip-ac3-2013.torrent";
//variable de test:
var identifiant = "freebox";
var password = "---";
var adresse_freebox = "http://mafreebox.freebox.fr";

// c'est parti :
download(url);


// -----------------------------------------------------------------------------

// Fonctions maître "download"
function download(url){
    console.info("URL= "+url);
    //alert(url);
    login();
}

function init(){
    var identifiant = encodeURIComponent(identifiant);
    var password = encodeURIComponent(password);
    var adresse_freebox = encodeURIComponent(adresse_freebox);
}

function login(){
    console.info("login");
    var xhr = new XMLHttpRequest();
    var TokenRequest = {
        "app_id": "com.aube-tech.atmyfreebox",
        "app_name": "aT my Freebox",
        "app_version": "0.0.1",
        "device_name": "Mon mac"
    };
    
    xhr.open('POST', (adresse_freebox + '/api/v1/login/authorize/'));
    //xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded"); //ça marche aussi, mais très propre car on envoi du JSON
    xhr.setRequestHeader("Content-Type", "application/json"; "charset", "utf-8");
    xhr.send(JSON.stringify(TokenRequest));
    
    xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
        console.info("login connexion ok! "+xhr.readyState+" - "+xhr.status);
        console.info("xhr: "+xhr.response);
        console.info("xhr resp: "+xhr.getAllResponseHeaders());
    }
    else {
        console.info("login NOK: "+xhr.readyState+" - "+xhr.status);
        console.info("xhr: "+xhr.response);
        console.info("xhr resp: "+xhr.getAllResponseHeaders());
        }
    };

}

