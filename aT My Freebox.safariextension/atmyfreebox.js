
// let's go

// -----------------
// les fonctions :
//  download        fonction maitre, obtient l'URL cliqué
//  authorize       obtient l'autorisation "app_token"
//  test_authorize  test que l'autorisation est validée
//

// -----------   TEST AREA --------------
//url de test:
var url = "http://www.cpasbien.me/_torrents/a-la-merveille-to-the-wonder-french-dvdrip-ac3-2013.torrent";
//variable de test:
//var identifiant = "freebox";
var adresse_freebox = "http://mafreebox.freebox.fr";
APPTOKEN = "";
CHALLENG = "";
//PASS = "";

// c'est parti :
download(url);


// -----------------------------------------------------------------------------

// Fonctions maître "download"
function download(url){
    console.info("URL= "+url);
    //alert(url);
    authorize();
    //session();
    //login();
    //download_list();
}


function authorize(){
    console.info("login");
    var xhr = new XMLHttpRequest();
    var TokenRequest = {
        "app_id": "com.aube-tech.atmyfreebox",
        "app_name": "aT my Freebox",
        "app_version": "0.0.2",
        "device_name": "mon mac"
    };
    
    xhr.open('POST', (adresse_freebox + '/api/v1/login/authorize/'));
    //xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded"); //ça marche aussi, mais très propre car on envoi du JSON
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify(TokenRequest));
    
    xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
        console.info("login connexion ok! "+xhr.readyState+" - "+xhr.status);
        console.info("xhr: "+xhr.response);
        console.info("xhr resp: "+xhr.getAllResponseHeaders());
        var reponse = JSON.parse(xhr.response);
        if (reponse.success = "true") {
            console.info("success!");
            var app_token = reponse.result.app_token; // AJOUT "var" = à modif pour extension safari
            APPTOKEN = app_token;
            var track_id = reponse.result.track_id
            console.info("App_token: "+ app_token);
            console.info("Track_ID: "+ track_id);
            // test authorize
            test_authorize(track_id);
        }
        else {
            console.info("Erreur lors de la demande d'autorisation à la Freebox");
        }
    }
    else {
        console.info("authorize NOK: "+xhr.readyState+" - "+xhr.status);
        console.info("xhr: "+xhr.response);
        console.info("xhr resp: "+xhr.getAllResponseHeaders());
        }
    };
} // authorize

function test_authorize(track_id){
    var xhr = new XMLHttpRequest();
    xhr.open('GET', (adresse_freebox + '/api/v1/login/authorize/' + track_id));
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            console.info("test xhr: "+xhr.response);
            var reponse = JSON.parse(xhr.response);
            if (reponse.success = "true") {
                console.info("réponse test: " + reponse.result.status);
                if (reponse.result.status == "granted") {
                    // ok autorisé
                    // save safari.extension.app_token = app_token;
                    console.info("youpiii");
                    get_challenge();
                }
                else if (reponse.result.status == "pending"){
                    console.info("Il faut autoriser l'extension \"At My Freebox\" directement sur l'afficheur LCD de la Freebox Server. Un petit appui sur le bouton tactile \">\" clignotant.");
                    setTimeout(function() {
                        // re-check toute les 2sec
                        test_authorize(track_id);
                    },2000);
                }
                else if (reponse.result.status == "denied"){
                    console.info("réponse denied: " + xhr.response);
                    alert("Euh? Il faut choisir \"OUI\" sur la Freebox...");
                }
                else {
                    // NOK : refusé par l'utilisateur, timeout de 90s ou inconnu
                    console.info("réponse status: " + reponse.result.status);
                    alert("Pas de réponse? Il faut re-essayer");
                }
            }
            else {
                alert(reponse.msg);
            }
        }
    }
} // test_authorize

function get_challenge() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', (adresse_freebox + '/api/v1/login/'));
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            console.info("get_challenge xhr: "+xhr.response);
            var reponse = JSON.parse(xhr.response);
            if (reponse.success = "true") {
                var challenge = reponse.result.challenge;
                console.info("réponse challenge: " + reponse.result.challenge);
                CHALLENG = challenge;
                session();
            }
            else {
                console.info("réponse challenge false: " + xhr.response);
                alert(reponse.msg);
            }
        }//xhr.readyState
    }//xhr.onreadystatechange
} // get_challenge

function session() {
    var challenge = CHALLENG;
    // save safari.extension.challenge = challenge;
    var app_token = APPTOKEN; //safari.extension.app_token;
    
    //--- test crypto
    console.info("app_token: "+app_token +"   --   challenge: "+challenge);
    //var hmac = CryptoJS.HmacSHA1(challenge,app_token);
    //var pass  = CryptoJS.enc.Utf8.stringify(hmac);

    var shaObj = new jsSHA(challenge, "TEXT");
    var hmac = shaObj.getHMAC(app_token, "TEXT", "SHA-1", "HEX");
    //--- fin test crypto
    
    console.info("session launch:     challenge= "+challenge+" -app_token= "+app_token+" -password= "+hmac);
    var SessionTokenRequest = {
        "app_id": "com.aube-tech.atmyfreebox",
        "password": hmac
    };
    console.info(SessionTokenRequest);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', (adresse_freebox + '/api/v1/login/session/'));
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify(SessionTokenRequest));
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            console.info("session xhr: "+xhr.response);
            var reponse = JSON.parse(xhr.response);
            if (reponse.success = "true") {
                session_token = reponse.result.session_token; // AJOUT "var" = à modif pour extension safari
                console.info("réponse session_token: " + reponse.result.session_token);
                console.info("session OK! au boulot... "+ session_token);
                //ready!
                console.info("url: "+url)
                download_add(url);
            }
            else {
                console.info("réponse session_token false: " + xhr.response);
                alert(reponse.msg);
            }
        }//xhr.readyState
        else {
            console.info("réponse session_token false: " + xhr.response);
        }
    }//xhr.onreadystatechange
}//session


// Pour le fun : pour retrouver les téléchargements en cours
function download_list() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', (adresse_freebox + '/api/v1/downloads/'));
    xhr.setRequestHeader("X-Fbx-App-Auth", session_token);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            console.info("login session xhr: "+xhr.response);
            var reponse = JSON.parse(xhr.response);
            if (reponse.success = "true") {
                console.info("réponse download_list: " + xhr.response);
            }
            else {
                console.info("réponse download_list false: " + xhr.response);
                alert(reponse.msg);
            }
        }//xhr.readyState
    }//xhr.onreadystatechange
}//download_list

function download_add(url_add) {
    console.info("url_add: "+url_add);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', (adresse_freebox + '/api/v1/downloads/add/'));
    xhr.setRequestHeader("X-Fbx-App-Auth", session_token);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.send("download_url=" + url_add);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            console.info("download_add xhr: "+xhr.response);

        }
    }
}//download_add

// fin