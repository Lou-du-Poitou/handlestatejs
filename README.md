# Ajoutez du dynamisme à vos applications

HandleState JS est une mini classe qui vous permet d'ajouter une couche de réactivité à vos applications.

Cette classe gère le principe de status assurant un rendu après chaque modification de sa valeur.

## Importer le script

```js
import HandleState from "https://handlestatejs.garoux.ovh/sources/handlestate.mjs";
```

[Télécharger le code](https://handlestatejs.garoux.ovh/sources/handlestate.mjs)

## Documentation

### *HandleState.prototype.constructor()*
**Permet de gérer un état rendant les fonction connectées à chaque changement d'état**  
`@param {any} initialValue=null`  

### *get value*
**Obtenir la valeur de l'état**  
`@return {any}`  

### *HandleState.prototype.set()*
**Définir la valeur de l'état**  
`@param {any} v`  
`@return {void}`  

### *HandleState.prototype.connect()*
**Connecter une fonction aux changements d'état**  
`@param {Function} render`  
`@param {boolean} firstRender=true`  
`@return {void}`  

### *HandleState.prototype.disconnect()*
**Déconnecter une fonction aux changements d'état**  
`@param {Function} render`  
`@return {void}`  

## Exemple

```js
import HandleState from "./handlestate.mjs";

/**
 * App (main)
 * 
 * @return {void}
 */
(function App() {
    // Le status
    const handleState = new HandleState(0);

    // Application (sommet du DOM)
    const app = document.querySelector("#app");

    // Sélection des éléments
    const count = app.querySelector("span");
    const reset = app.querySelector("button");
    
    // Pour remettre le compteur à 0
    reset.addEventListener("click", () => {
        handleState.set(0);
    });

    // Le rendu
    const render = () => {
        if (!count) return;
        
        count.innerText = handleState.value;
    };

    // On connecte les rendus aux status
    handleState.connect(render);

    // On incrémente toutes les 1s
    setInterval(() => {
        handleState.set(v => ++v);
    }, 1000);
})();
```

Voir https://handlestatejs.garoux.ovh pour des exemples ou plus d'explications.
