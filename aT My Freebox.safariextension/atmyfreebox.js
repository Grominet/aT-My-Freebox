/**
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * Author: Arnaud LECLAIRE © 2013 */

// let's go

// -----------------------------------------------------------------------------
// les variables de base nécessaires :
//  adresse_freebox : adresse http de la freebox
//  url : url cliqué à téléchargé avec l'extension
//  app_token : la pass phrase liée à l'autorisation utilisé pour obtenir une session / vide si première connexion
//  challenge : le pass temporaire pour obtenir une session
//  session_token : le token temporaire de la session en cours
// -----------------
// les fonctions :
//  download        fonction maitre, obtient l'URL cliqué
//  authorize       obtient l'autorisation "app_token"
//  test_authorize  test que l'autorisation est validée
//  get_challenge   obtient le numéro de challenge temporaire (pour une session)
//  session         obtient le token_session pour enfin communiquer avec la freebox
//  download_list   fonction pour le fun, obtient la liste des téléchargements en cours
//  download_add    ajoute un fichier au téléchargement de la freebox
// -----------------------------------------------------------------------------


// Fonctions maître "download"
function download(url){
    //alert("url: "+url);
    console.info("URL= "+url);
    
    
    
    url=encodeURIComponent(url);
    
    // il faut tester si déjà autorisé (app_token déjà enregistré)
    if (!app_token){
        //alert("Pas de token dispo?");
        authorize(); //si non : on demande l'autorisation
    }
    else
    {
        if (!session_token){ // on test si la session est valide
            //alert("App token OK, pas de sesion token");
            get_challenge(); //si non on en demande une nouvelle
        }
        else
        {
            //alert("Téléchargement lancé;");
            download_test(url); // si tout est prêt on essaye de télécharger
        }
    }
}

var notify = function(titre,body,tag) {
    // check for notification compatibility
    if(!window.Notification) {
        // if browser version is unsupported, be silent
        return;
    }
    // log current permission level
    console.log(Notification.permission);
    // if the user has not been asked to grant or deny notifications from this domain
    if(Notification.permission === 'default') {
        Notification.requestPermission(function() {
            // callback this function once a permission level has been set
            notify();
        });
    }
    // if the user has granted permission for this domain to send notifications
    else if(Notification.permission === 'granted') {
        var n = new Notification(
                    titre,
                    {
                      'body': body,
                      // prevent duplicate notifications
                      'tag' : tag
                    }
                );
        // remove the notification from Notification Center when it is clicked
        n.onclick = function() {
            this.close();
        };
        // callback function when the notification is closed
        n.onclose = function() {
            console.log('Notification closed');
        };
    }
    // if the user does not want notifications to come from this domain
    else if(Notification.permission === 'denied') {
        // be silent
        return;
    }
};

function random_id(){
var randomnumber=Math.floor(Math.random()*101);
console.info("random id computer: "+randomnumber);
return randomnumber;
}

function authorize(){
    //alert("authorize");
    console.info("authorize");
    var xhr = new XMLHttpRequest();
    var TokenRequest = {
        "app_id": "com.aube-tech.atmyfreebox",
        "app_name": "aT my Freebox",
        "app_version": "1.1.3",
        "device_name": "mon mac ("+ random_id() +")" //random_id pour multiple ordi sur même freebox
    };
    xhr.open('POST', (adresse_freebox + '/api/v1/login/authorize/'));
    //xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded"); //ça marche aussi, mais pas très propre car on est en JSON
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify(TokenRequest));
    
    // alert pour prévenir l'utilisateur qu'il faut cliquer manuellement
    alert("Il faut autoriser l'extension \"At My Freebox\" directement sur l'afficheur LCD de la Freebox Server. Un petit appui sur le bouton tactile \">\" clignotant.");
    xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
        console.info("login connexion ok! "+xhr.readyState+" - "+xhr.status);
        console.info("xhr authorize: "+xhr.response);
        //console.info("xhr resp: "+xhr.getAllResponseHeaders());
        var reponse = JSON.parse(xhr.response);
        if (reponse.success) {
            console.info("success!");
            app_token = reponse.result.app_token;
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
                    // save safari.extension.settings.app_token = app_token;
                    if(safari_extension){
                        safari.extension.settings.app_token = app_token;
                    }
                    console.info("youpiii granted");
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
                    return
                }
                else {
                    // NOK : refusé par l'utilisateur, timeout de 90s ou inconnu
                    console.info("réponse status: " + reponse.result.status);
                    alert("Pas de réponse? Il faut re-essayer");
                    return
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
            console.info(reponse.success);
            if (reponse.success) {
                challenge = reponse.result.challenge;
                console.info("réponse challenge: " + reponse.result.challenge);
                //CHALLENG = challenge;
                if (safari_extension) { // enregistre en local si possible
                    safari.extension.settings.challenge = challenge;
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
    // save     //var app_token = APPTOKEN; //safari.extension.settings.app_token;
    
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
                    session_token = reponse.result.session_token;
                    if (safari_extension) { // enregistre en local si possible
                        safari.extension.settings.session_token = session_token;
                    }
                    console.info("réponse session_token: " + reponse.result.session_token);
                    console.info("session OK! au boulot... ");
                    //ready!
                    console.info("url: "+url)
                    download_test(url);
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

function download_test(url_file){

download_add(url_file);
return;

// squizzé pour l'instant
var xhr = new XMLHttpRequest();
    xhr.open('GET', url_file);
    //xhr.responseType = 'arraybuffer';
    xhr.overrideMimeType('text/plain; charset=x-user-defined');
    xhr.send(); //on télécharge le fichier .torrent lié au lien
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            console.info("plop");
            console.info("fichier téléchargé: "+xhr.response);
	
			if (xhr.response.substring(0,11) === "d8:announce") {
				//vérif que le browser n'est pas un tacot
				if (window.File && window.FileReader && window.FileList && window.Blob) {
					console.info("browser OK");
					var reader = new FileReader();
					var oMyBlob = new Blob([this.response]); // the blob
					reader.readAsText(oMyBlob);
					reader.onload = function() {
						console.info('Contenu du fichier "' + url_file + '" :\n\n' + reader.result);
						download_add_blob(reader);
					};
				}
				else {
					alert("Malheureusement, votre navigateur est complètement dépassé. At my Freebox ne peut continuer");
				}
			}
			else {
				download_add(url_file);
    		} //torrent d8
        } // readyState
    } // function

}

function download_add(url_add) {
    // ------------------------------------------------
    // ajoute un download à la Freebox
    // marche avec :
    //      .torrent
    //      :magnet
    //      file à tester
    // ------------------------------------------------
    // alert("download add: "+url+" - "+session_token);
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
				if (xhr.response.success = true) {
					notify("Téléchargement lancé","URL: "+url_add,"atmyfreebox"+random_id()+random_id()+random_id()+random_id()+random_id());
	                console.info("envoi du download réussi!");
                }
                else {
                	console.info("envoi raté, essai en Blob");
                	download_file(url_file);
                }
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

function test(url) {
    console.info("mode test");
    //download_file(url); //test blob
    download(url);
}

function download_file(url_file) {

var xhr = new XMLHttpRequest();
    xhr.open('GET', (url_file));
    xhr.responseType = 'arraybuffer';
    //xhr.overrideMimeType('text/plain; charset=x-user-defined');
    xhr.send(); //on télécharge le fichier .torrent lié au lien
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            console.info("plop");
            console.info("fichier téléchargé: "+xhr.response);

			//vérif que le browser n'est pas un tacot
			if (window.File && window.FileReader && window.FileList && window.Blob) {
				console.info("browser OK");
				var reader = new FileReader();
				var oMyBlob = new Blob([this.response]); // the blob
				reader.readAsText(oMyBlob);
				reader.onload = function() {
					console.info('Contenu du fichier "' + url_file + '" :\n\n' + reader.result);
					download_add_blob(reader)
				};
			}
			else {
				alert("Malheureusement, votre navigateur est complètement dépassé. At my Freebox ne peut continuer");
    		}
        } // readyState
    }
}

function download_add_blob(reader) {
    // ------------------------------------------------
    // ajoute un download à la Freebox
    // marche avec :
    //      .torrent
    //      :magnet
    //      file à tester
    // ------------------------------------------------
    // alert("download add: "+url+" - "+session_token);
    console.info("add blob url_add reader.result: "+reader.result);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', adresse_freebox + '/api/v1/downloads/add/', true);
    xhr.setRequestHeader("X-Fbx-App-Auth", session_token);
    xhr.setRequestHeader("Content-Type","multipart/form-data; boundary=---------------------------176791920111939857911845395343");
    xhr.send("---------------------------176791920111939857911845395343\n"+
    'Content-Disposition: form-data; name="download_dir"\n\n'+
    '\n'+
    '---------------------------176791920111939857911845395343\n\n'+
    'Content-Disposition: form-data; name="archive_password"\n'+
    '\n'+
    '---------------------------176791920111939857911845395343\n'+   
	'Content-Disposition: form-data; name="download_file"; filename="torrent_authentifie.torrent"\n'+
    'Content-Type: application/x-bittorrent \n\n'+
    reader.result);
    //xhr.send(torrent);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
        var reponse = JSON.parse(xhr.response);
            if (xhr.status === 200) {
                console.info("download_add_blob xhr: "+xhr.response);
                console.info("envoi du blob effectué!");
                if (reponse.success) {
                	console.info("envoi du blob réussie");
                	}
                else {
                	console.info("envoi du blob raté : "+reponse.error_code);
                }
                return;
            }
            else {
                console.info("download_add_blob xhr false: "+xhr.response);
                if (reponse.error_code == "auth_required")
                {
                	console.info("error code auth required");
                    return;
                }
            }//xhr.Status
        }//xhr.readyState
    }
}//download_add

function getBlob(url, callback) {
    var xhr = new XMLHttpRequest();  // Create new XHR object
    xhr.open("GET", url);            // Specify URL to fetch
    xhr.responseType = "blob"        // We'd like a Blob, please
    xhr.onload = function() {        // onload is easier than onreadystatechange
        callback(xhr.response);      // Pass the blob to our callback
    }                                // Note .response, not .responseText
    xhr.send(null);                  // Send the request now
}



// fin