
// let's go

// -----------------------------------------------------------------------------
// les variables de base nécessaires :
//  adresse_freebox : adresse http de la freebox
//  url : url cliqué à téléchargé avec l'extension
//  app_token : la pass phrase liée à l'autorisation utilisé pour obtenir une session / vide si première connexion
//  challenge : le pass temporaire pour obtenir une session
//  session_token : 
// -----------------
// les fonctions :
//  download        fonction maitre, obtient l'URL cliqué
//  authorize       obtient l'autorisation "app_token"
//  test_authorize  test que l'autorisation est validée
//  get_challenge   obtient le numéro de challenge temporaire
//  session         obtient le token_session pour enfin communiquer avec la freebox
//  download_list   fonction pour le fun, obtient la liste des téléchargements en cours
//  download_add    ajoute un fichier au téléchargement de la freebox
// -----------------------------------------------------------------------------


// Fonctions maître "download"
function download(url){
    //alert("url: "+url);
    console.info("URL= "+url);
    
    // il faut tester si déjà autorisé (app_token déjà enregistré)
    if (!app_token){
        authorize(); //si non : on demande l'autorisation
    }
    else
    {
        if (!session_token){ // on test si une session est présente
            get_challenge(); //si non on en demande une
        }
        else
        {
            download_add(url); // si tout est prêt on essaye de télécharger
        }
    }
}


function authorize(){
    //alert("authorize");
    console.info("login");
    var xhr = new XMLHttpRequest();
    var TokenRequest = {
        "app_id": "com.aube-tech.atmyfreebox",
        "app_name": "aT my Freebox",
        "app_version": "0.0.2",
        "device_name": "mon mac"
    };
    xhr.open('POST', (adresse_freebox + '/api/v1/login/authorize/'));
    //xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded"); //ça marche aussi, mais pas très propre car on est en JSON
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify(TokenRequest));
    
    // alert pour prévenir l'utilisateur qu'il faut cliquer manuellement
    alert("Il faut autoriser l'extension At my Freebox sur l'afficheur LCD de la Freebox");
    xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
        console.info("login connexion ok! "+xhr.readyState+" - "+xhr.status);
        console.info("xhr authorize: "+xhr.response);
        //console.info("xhr resp: "+xhr.getAllResponseHeaders());
        var reponse = JSON.parse(xhr.response);
        if (reponse.success) {
            console.info("success!");
            app_token = reponse.result.app_token; // AJOUT "var" = à modif pour extension safari
            //APPTOKEN = app_token;
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
            if (reponse.success) {
                console.info("réponse test: " + reponse.result.status);
                if (reponse.result.status == "granted") {
                    // ok autorisé
                    // save safari.extension.app_token = app_token;
                    if(safari_extension){
                        safari.extension.app_token = app_token;
                    }
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
                // erreur si
                alert("Erreur d'autorisation: "+reponse.msg);
            }
        }
    }
} // test_authorize

function get_challenge() {
    //alert("get challenge");

    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', (adresse_freebox + '/api/v1/login/'));
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            console.info("get_challenge xhr: "+xhr.response);
            var reponse = JSON.parse(xhr.response);
            if (reponse.success) {
                challenge = reponse.result.challenge;
                console.info("réponse challenge: " + reponse.result.challenge);
                //CHALLENG = challenge;
                if (safari_extension) { // enregistre en local si possible
                    safari.extension.challenge = challenge;
                }
                session();
            }
            else {
                console.info("réponse challenge false: " + xhr.response);
                alert("Impossible d'avoir une session avec la Freebox : "+reponse.msg);
            }
        }//xhr.readyState
    }//xhr.onreadystatechange
} // get_challenge

function session() {
    //alert("session");
    //var challenge = CHALLENG;
    // save     //var app_token = APPTOKEN; //safari.extension.app_token;
    
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
        if (xhr.readyState === 4) {
            console.info("session xhr: "+xhr.response);
            var reponse = JSON.parse(xhr.response);
            if ( xhr.status === 200){
                if (reponse.success) {
                    session_token = reponse.result.session_token; // AJOUT "var" = à modif pour extension safari
                    if (safari_extension) { // enregistre en local si possible
                        safari.extension.session_token = session_token;
                    }
                    console.info("réponse session_token: " + reponse.result.session_token);
                    console.info("session OK! au boulot... "+ session_token);
                    //ready!
                    console.info("url: "+url)
                    download_add(url);
                }
                else {
                    console.info("réponse session_token false: " + xhr.response);
                    alert("Impossible d'avoir l'autorisation de la Freebox : "+reponse.msg);
                }
            }
            else {
                console.info("réponse session_token statut !200 : " + xhr.response);
                if (reponse.error_code == "invalid_token")
                {
                    authorize();
                    return;
                }
            }
        }//xhr.readyState
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
            if (reponse.success) {
                console.info("réponse download_list: " + xhr.response);
                return;
            }
            else {
                console.info("réponse download_list false: " + xhr.response);
                alert("Impossible d'obtenir la liste des téléchargements sur la Freebox : "+reponse.msg);
                return;
            }
        }//xhr.readyState
    }//xhr.onreadystatechange
}//download_list

function download_add(url_add) {
    //alert("download add: "+url+" - "+session_token);
    console.info("url_add: "+url_add);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', (adresse_freebox + '/api/v1/downloads/add/'));
    xhr.setRequestHeader("X-Fbx-App-Auth", session_token);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.send("download_url=" + url_add);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
        var reponse = JSON.parse(xhr.response);
            if (xhr.status === 200) {
                console.info("download_add xhr: "+xhr.response);
                console.info("download réussi!");
                return;
            }
            else {
                console.info("download_add xhr false: "+xhr.response);
                if (reponse.error_code == "auth_required")
                {
                    get_challenge();
                    return;
                }
            }//xhr.Status
        }//xhr.readyState
    }
}//download_add

// fin