// Pour obtenir le lien cliqué
// a chaque chargement de page web, on décrit sa structure pour l'analyse du lien cliqué

// Obtenir le dernier élément cliqué
var lastRightClickedElement;
var lastContextMenuEventTime;

// Register for the contextmenu event.
document.addEventListener("contextmenu", handleContextMenu, false);

// use custom traverser to avoid including jQuery here, since this method
// is called on *every* page load
function findParentNode(parentTagName, childObj) {
    var testObj = childObj;
    while(testObj.tagName != parentTagName) {
        testObj = testObj.parentNode;
        if (testObj.tagName == 'HTML') {
            return null;
        };
    }
    return testObj;
}

function handleContextMenu(event)
{
	// remonte le noeud jusqu'au lien (balise "A")
    lastRightClickedElement = event.target;
    lastContextMenuEventTime = new Date().getTime();
    target = findParentNode('A', event.target)
    
    // réponse seulement si c'est un lien
    if (target != null) {
        // Pass the right-clicked element's target url and the timestamp up to the global page.
        safari.self.tab.setContextMenuEventUserInfo(event, {
            "timestamp": lastContextMenuEventTime, "target_url": target.href });
    }
}
