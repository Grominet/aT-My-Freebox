// Pour obtenir le lien cliqué
// a chaque chargement de page web, on décrit sa structure pour l'analyse du lien cliqué

// Obtenir le dernier élément cliqué
var lastRightClickedElement;
var lastContextMenuEventTime;

// Register for the contextmenu event.
document.addEventListener("contextmenu", handleContextMenu, false);

// on cherche le noeud sur lequel on a cliqué (qui n'est pas HTML)
function findParentNode(parentTagName, childObj) {
    var testObj = childObj;
    while(testObj.tagName !== parentTagName) {
        testObj = testObj.parentNode;
        if (testObj.tagName === 'HTML') {
            return null;
        };
    }
    return testObj; // on retourne le tag
}

function handleContextMenu(event)
{
	// remonte le noeud jusqu'au lien (balise "A")
    lastRightClickedElement = event.target;
    lastContextMenuEventTime = new Date().getTime();
    target = findParentNode('A', event.target);
    
    // réponse seulement si c'est un lien
    if (target !== null) {
        // Pass the right-clicked element's target url and the timestamp up to the global page.
        safari.self.tab.setContextMenuEventUserInfo(event, {
            "timestamp": lastContextMenuEventTime, "target_url": target.href });
    }
}
