/**
 * Voir la doc {@link https://handlestatejs.garoux.ovh HandleStateJS}
 * et {@link https://github.com/Lou-du-Poitou/handlestatejs GitHub}
 * @license WTFPL
 * @author lou_du_poitou
 */

/**
 * Permet de gérer un état rendant les fonction 
 * connectées à chaque changement d'état
 * 
 * Get:
 * value
 * 
 * Méthodes d'instance:
 * set()
 * connect()
 * disconnect()
 * 
 * @param {any} initialValue
 * @property {any} value
 */
class HandleState {
    #value
    #connected = new Set();

    constructor(initialValue = null) {
        this.#value = initialValue;
    }

    /**
     * Obtenir la valeur de l'état
     * 
     * @return {any}
     */
    get value() {
        return this.#value;
    }

    /**
     * Définir la valeur de l'état
     * 
     * @param {any | Function} v
     * @return {void}
     */
    set(v) {
        if (v instanceof Function && arguments.length > 0) {
            this.#value = v(this.#value);
        } else {
            // Ne pas mettre à jour si les objets sont les mêmes
            if (Object.is(this.#value, v)) return;

            this.#value = v;
        }

        this.#connected.forEach(render => render());
    }

    /**
     * Connecter une fonction aux
     * changements d'état
     * 
     * @param {Function} render 
     * @param {boolean} firstRender
     * @return {void}
     */
    connect(render, firstRender=true) {
        this.#connected.add(render);
        if (firstRender) {
            render();
        }
    }

    /**
     * Déconnecter une fonction aux
     * changements d'état
     * 
     * @param {Function} render 
     * @return {void}
     */
    disconnect(render) {
        this.#connected.delete(render);
    }
}

export default HandleState;
