/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * VisuClimat : visualisez les changements environnementaux de la Terre
 * https://github.com/serge-golovanow/VisuClimat
 * Copyright (c) 2018, Serge Golovanow <serge@sendell.com>
 *
 * Publié sous licence libre GNU General Public License 3 :
 *   Ce programme est un logiciel libre ; vous pouvez le redistribuer ou le modifier suivant les termes de la GNU General Public License telle que publiée par la Free Software Foundation ; soit la version 3 de la licence, soit (à votre gré) toute version ultérieure.
 *   Ce programme est distribué dans l'espoir qu'il sera utile, mais SANS AUCUNE GARANTIE ; sans même la garantie tacite de QUALITÉ MARCHANDE ou d'ADÉQUATION à UN BUT PARTICULIER. Consultez la GNU General Public License pour plus de détails.
 *   Vous devez avoir reçu une copie de la GNU General Public License en même temps que ce programme (LICENCE.txt) ; si ce n'est pas le cas, consultez <http://www.gnu.org/licenses>.
 *
 * Requiert les librairies suivantes :
 *  jQuery                  Licence MIT     (c) JS Foundation and other contributors  |  http://jquery.org/license
 *  jquery.dynamic-url      Licence MIT     Copyrighted 2013 by Toni Almeida, promatik.
 *  jquery.touchSwipe       Licence MIT     Copyright (c) 2010-2015 Matt Bryson
 *  screenfull.js           Licence MIT     (c) Sindre Sorhus
 *  Cocoen                  Licence MIT     (c) Koen Romers
 *
 * Chrome (ou Chromium) est le navigateur recommandé (au moins version 42), Firefox est compatible (au moins version 46).
 *
 * version 2018-07-03
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

"use strict"; // Un peu de rigueur sur la déclaration des variables

jQuery(document).ready(function($){ 

    /*
     * Variables globales
     */

    /** @type {Cocoperso} Objet de la librairie Cocoen surclassée en Cocoperso */
    var cocoen;
    /** @type {number[][]} Index des images : [index,[theme,image]] */
    var index = [];
    /** Image actuellement affichée (comptée à partir de 0) */
    var actuelle = 0;
    /** timestamp (en ms) du dernier scroll */
    var scrolllast = 0;
    /** quel intervalle minimal (en ms) entre deux crans de molette de souris */
    const delai = 501;  
    /** largeur (en pixels) d'affichage des images */
    const largeurimage = 1350;  


    /**
     * Sur-classe de Cocoen, permet de garder la librairie telle quelle et d'avoir mes modifications ici
     */
    
    class Cocoperso extends Cocoen {

        /** Vérifications de base, méthode héritée, puis attribue l'id #wrapper au div créé pour contenir img#avant et #avant-date */
        createElements() {
            if ($("div#cocoen.cocoen").length !== 1) throw new DOMException('Il faut UN élément &lt;div id="cocoen" class="cocoen"&gt; !!');
            if ($("div#cocoen.cocoen>img#avant.cocoimg , div#cocoen.cocoen>img#apres.cocoimg").length !== 2) throw new DOMException('Il faut des images &lt;img id="avant" class="cocoimg"&gt; et &lt;img id="apres" class="cocoimg"&gt; !!');
            try { super.createElements(); } // méthode héritée, crée un div dans #cocoen pour y mettre l'image avant
            catch(e) { console.error(e); throw new DOMException("Impossible d'initialiser les éléments : "+e); }
            $(".cocoen>div:first-child").attr('id','wrapper'); // on donne un id #wrapper au div créé
            $("#avant-date").detach().appendTo('#wrapper'); // on y met aussi la date avant
        }

        /** pour pouvoir déclencher moi-même un faux clic par trigger (lui-même déclenché par un clic droit) */
        onDragEnd(e) {
            if (this.isDragging) this.isDragging = false; // ça c'est le comportement par défaut
            else if ($(e.target).hasClass('cocoimg')) super.onTap(e);  // mais moi je veux ça aussi, vu que c'est les mouseup qui déclenchent cette fonction
        }

        /** Meilleure définition des listeners, je vais notamment capter les clics droits & co */
        addEventListeners() {
            // ajout des {passive: false} pour la nouvelle gestion des touchevents passifs par Chrome >=51
            //this.element.addEventListener('click', this.onTap.bind(this)); // c'est lui qu'il faut virer, on passera par le mouseup
            this.element.addEventListener('mousemove', this.onDrag.bind(this));
            this.element.addEventListener('touchmove', this.onDrag.bind(this),{passive: false});
            this.dragElement.addEventListener('mousedown', this.onDragStart.bind(this));
            this.dragElement.addEventListener('touchstart', this.onDragStart.bind(this),{passive: false}); //{passive: true}

            window.addEventListener('mouseup', this.onDragEnd.bind(this)); // capte si on termine un slide hors de #cocoen
            window.addEventListener('resize', this.dimensions.bind(this)); // capte aussi le changement de zoom
        }

        /** défini jusqu'où on peut slider par rapport au bord de l'image */
        dimensions() {
            let ecart = 10; // en pixel, écart minimal au bord de l'image (10 par défaut)
            super.dimensions(); // méthode d'origine
            this.minLeftPos = this.elementOffsetLeft + ecart;
            this.maxLeftPos = (this.elementOffsetLeft + this.elementWidth) - this.dragElementWidth - ecart;
        }

        /** Utilisation de jQuery effects pour un slide progressif */
        drag() {
            if (this.leftPos < this.minLeftPos) {
                this.leftPos = this.minLeftPos;
            } else if (this.leftPos > this.maxLeftPos) {
                this.leftPos = this.maxLeftPos;
            }
            let timing = (this.isDragging ? 0 : 1500); // si on déplace le curseur à la main, on se synchronise bien sûr immédiatement !

            let openRatio = (this.leftPos + (this.dragElementWidth / 2)) - this.elementOffsetLeft;
            openRatio /= this.elementWidth;
            const width = `${openRatio * 100}%`;

            let oldRatio = this.beforeElement.style.width;
            if (oldRatio == '') oldRatio = '50';
            let distance = Math.abs(parseFloat(width) - parseFloat(oldRatio))/100;
            distance += (1-distance)/4; // ralenti les petits distances
            timing *= distance;

            $(this.options.dragElementSelector).stop(true).animate({'left':width},timing);
            $("#wrapper").stop(true).animate({'width':width},timing); 
            if (this.options.dragCallback) {
                this.options.dragCallback(openRatio);
            }
        } // fin drag()
    } // fin classe Cocoperso


    /*
     * initialisations et première image affichée
     */

    index = liens(); // lit la configuration pour remplir div#liste avec les themes et images ; retourne le tableau index[]
    if (!index.length) throw new Error("Erreur au chargement de la configuration, apparemment pas d'images présentes"); // si index est vide, on se vautre lamentablement
    else $("#legende").html("Chargement de la première image en cours"); // tout s'est bien passé, on ne garde pas le message d'erreur

    actuelle = init(); // initialisations diverses, notamment ajout de classes CSS

    try { cocoen = new Cocoperso(); } // tout est prêt pour gérer les images, instanciation d'un Cocoperso (creation du #wrapper, du slider, ...)
    catch(e) { $("#titre").html("Erreur à l'initialisation de Cocoen : "+e); throw new Error("Erreur à l'initialisation de Cocoen : "+e) } // crash !

    aftheme(index[actuelle][0],0); // affichage du theme correspondant, animation en 0ms
    affiche(actuelle,0); // premier affichage d'une image en 0ms, actuelle a été définie par init()

    /*
     * Fonctions
     */

    /** Traitements à l'affichage de la page
     * @returns {number} image à afficher (par défaut ou depuis les paramètres de l'URL)
     */
    function init() {
        /** ID de la première image à afficher, récupérée depuis l'URL ou définie à la valeur par défaut */
        let premiere;

        // on essaye de récupérer le paramètre depuis l'url, sinon on définit à la valeur pardefaut :
        try {
            premiere = $.getVars()['image'];
            if (RegExp(/^[0-9]+$/).test(premiere) && premiere < index.length ) { // on vérifie que ça ait la tête d'un entier positif inférieur au nombre d'images
                premiere = parseInt(premiere);  // cast vers int
            }
            else premiere = pardefaut; // on se donne pas la peine de prévenir
        } catch(e) { premiere=pardefaut; console.warn("Erreur pour récupérer l'image depuis l'URL : "+e); } // en cas de soucis

        // gestion du précédent/suivant :
        try { // jquery.dynamic-url : https://github.com/promatik/jQuery-Dynamic-URL
            $.onPopState(function(e) {
                $.loadURL(); // on récupère la nouvelle URL
                premiere = $.getVars()['image']; // la paramètre image dans celle-ci
                affiche(premiere);
                aftheme(index[premiere][0]);
            });
        } catch(e) { console.warn("Erreur pour gérer précédent/suivant : "+e); }

        // on trape les clics droits et du milieu pour en faire des clics classiques :
        try {
            $(document).bind('contextmenu click', function(e) {
                if (e.which == 3 || e.which == 2) {
                    console.log(e);
                    //e.stopPropagation(); // ?
                    e.preventDefault();
                    $(e.target).triggerHandler('click',e);
                }
            });
        } catch(e) { console.warn("Erreur pour gérer le clic droit/du milieu : "+e); }

        window.ondragstart = function() { return false; } // Désactive le drag & drop

        // on gère le balayage, mollette de souris :
        swipes();
        wheel();

        // si on a activé le mode tactile dans la conf, ajout de la classe correspondante à <html> pour masquer le pointeur de souris :
        if (tactile) { $('html').addClass('tactile'); }

        // plein écran au clic sur l'aide
        //$('#info').click(function(e){ if (screenfull.enabled) {screenfull.request();} });

        // si Cocoen a déjà été instancié, on le met à jour pour qu'il tienne compte des éventuels changements de CSS :
        if (typeof cocoen !== "undefined") cocoen.dimensions();

        return premiere;
    }//fin function init()

    /** Affiche une image et tout ce qui lui est lié
     * @param {number} id Identifiant de l'image parmi les éléments
     * @param {number} timing En combien de temps afficher l'image
     */
    function affiche(id,timing=500) {
        let theme,image; //identifiant du theme et de l'image dans le theme
        [theme,image] = index[id]; //récupération du theme et de l'identifiant de cette image dans le theme à partir de l'index
        let elem = elems[theme]['images'][image]; //l'élément courant
        if (actuelle != id) { actuelle = id; } // ça ne devrait pas arriver, mais bon...

        $('div.btelem.actif').removeClass('actif'); // tous les <div> de classe .btelem ET .actif

        // si cette fonction est appelée alors que #apres2 existe encore, c'est qu'elle était encore en cours d'execution, on y met un terme :
        if ($('img.fondu').length) { //s'il reste des élements de classe fondu
            $("div#cocoen").stop(true); // on arrête le redimensionnement (capital ! sinon ça déclencherait des évènements gênants à son terme)
            $('img#avant, img#apres').remove(); // on vire l'ancien #avant et l'ancien #apres
            $("img#avant2:first").stop(true).attr('id','avant').removeClass('fondu'); // le nouvel avant devient ancien
            $("img#apres2:first").stop(true).off('load').attr('id','apres').removeClass('fondu'); // le nouvel apres devient ancien
            if ($('img.fondu').length) { console.info("Il reste des éléments .fondu : "+$('.fondu')); $(".fondu").remove(); } // ca semble peu probable mais au cas où...
        }

        // ajout des nouvelles images par dessus les anciennes, pour le moment invisibles (Edge va pourtant faire un flash...) :
        $(document.createElement('img')).hide().attr('id','avant2').attr('alt','Image VisuClimat').addClass('fondu cocoimg').attr('src',basedir+elem["avant"]).appendTo('#wrapper');
        $(document.createElement('img')).hide().attr('id','apres2').attr('alt','Image VisuClimat').addClass('fondu cocoimg').attr('src',basedir+elem["apres"]).appendTo('#cocoen');
        $('html').addClass('wait'); // le pointeur de souris devient un sablier

        // des que la 2eme nouvelle image est chargée, on va rendre les nouvelles visibles avec un fondu :
        $("img#apres2").on('load',function() {
            $('html').removeClass('wait'); // on vire le sablier

            // mise à jour de l'URL, Edge va se vautrer pour une page locale (C:\C:\) :
            try { // jquery.dynamic-url : https://github.com/promatik/jQuery-Dynamic-URL
                let param;
                $.loadURL(); // on récupère l'URL actuelle : on ne la mettra à jour que si nécessaire
                param = $.getVars()['image']; // la paramètre image dans celle-ci
                if (param != id) { $.pushVar("image", id, "", true); } // on met à jour l'URL si nécessaire
            } catch(e) { console.warn("Erreur du pushVar : "+e); } // en cas d'erreur on enchaine

            // il va aussi falloir adapter la hauteur de l'image (de div#cocoen concrètement) :
            var newheight = $(this).get(0).naturalHeight;
            var newwidth = $(this).get(0).naturalWidth;
            newheight *= (largeurimage/newwidth);
            newheight = Math.floor(newheight); // ceil ?

            // mise à jour du contenu :
            document.title = 'VisuClimat : '+(elem["lieu"]).replace(/<[^>]+>/g,'') ; // <title> de la page
            $("h2#titre").html(elem["titre"]); // titre
            $("div#legende").html(elem["legende"]); // legendre
            $("div#credit").html('<p>'+elem["credit"]+'</p>'); // crédit
            $('div#avant-date').html(elem['avant-date']); // date avant
            $('div#apres-date').html(elem['apres-date']); // date apres

            $('div#btelem-'+id).addClass('actif'); // ajout de la classe actif

            // quand les fondus sont terminés, on enlève les anciennes images et les nouvelles prennent leur place :
            $('img.fondu').fadeIn(timing);
            $("div#cocoen").stop(true).animate({'height':newheight},timing,function(){ // quand l'animation est terminée :
                $('img#avant, img#apres').remove(); // on vire l'ancien #avant et #apres
                $("img#avant2:first").attr('id','avant').removeClass('fondu'); // le nouvel avant devient ancien
                $("img#apres2:first").attr('id','apres').removeClass('fondu'); // le nouvel apres devient ancien
                $('img.fondu').remove(); // suppression de ce qui pourrait rester
            });

        });//fin #apres2.onload()
    }//fin function affiche()

    /** Génère liste des themes/images dans #liste et renvoie [index,[theme,image]] */
    function liens() {
        /** Compteur total images */
        let compteur = 0;
        /** Index des images/themes en cours de construction, sera retourné à la fin */
        let tabindex = [];

        for (let i=0;i<elems.length;i++) { // pour chaque theme :
            let theme = elems[i]; // le thème courant
            $(document.createElement('div')).addClass('theme').attr('id','theme-'+i).attr('data-theme-id',i).appendTo('#liste'); // le <div> du theme
            $(document.createElement('h3')).html(theme['theme']).appendTo('#theme-'+i); //le titre <h3>
            $(document.createElement('div')).addClass('theme-images').attr('id','theme-images-'+i).hide().appendTo('#theme-'+i); //le <div> des images du theme

            for (let j=0;j<theme['images'].length;j++) { // pour chaque image du theme :
                let image = theme['images'][j]; // l'image courante
                $(document.createElement('div')).addClass('btelem').attr('data-id',compteur).attr('id','btelem-'+compteur).html(image['lieu']).appendTo('#theme-images-'+i); //le <div> de l'image
                tabindex[compteur++] = [i,j]; // on complète l'index et incrémente le compteur
            }

        }
        // en bas de #liste :
        $(document.createElement('div')).attr('id','info').html("<p style='cursor:help;'>Choisissez un thème et un lieu, ou "+(tactile ? "balayez verticalement l'écran":"utilisez la molette de souris")+" pour naviguer parmi les "+tabindex.length+" images. &nbsp; Déplacez le curseur vertical ou cliquez sur l'image pour comparer avant/après.</p>").appendTo('#liste');
        $(document.createElement('div')).attr('id','credit').html("").appendTo('#liste');

        // déclencheurs des thèmes et images :
        $("div.theme h3").on('click',function() { // au clic sur le titre d'un thème :
            aftheme( $(this).parent().attr('data-theme-id') ); // c'est le <div> parent qui a le data-theme-id
        });
        $("div.theme div.btelem").on("click",function(){ // au clic sur un bouton image :
            let monid = $(this).attr("data-id"); // l'id de l'image est stocké dans le <div data-id="">
            if (monid != actuelle) { // si ce n'est pas l'image déjà affichée..
                actuelle = monid; //.. ça le devient
                affiche(actuelle); // le thème est forcément déjà ouvert, mais on affiche l'image tant qu'à faire
            }
        });

        return tabindex; // on renvoit l'index qu'on a pu générer
    }//fin function liens()

    /** Affiche un thème (le déplie, replie les autres)
     * @param {number} themeid Le thème à afficher
     * @param {number} delais En combien de temps le slide doit être fait
     */
    function aftheme(themeid,timing=500) {
        if ($('div#theme-'+themeid).length === 1 && !$('div#theme-'+themeid).hasClass("ouvert")) { // si le theme existe et n'est pas ouvert
            //$('div.theme.ouvert div.theme-images').stop(true).slideUp(timing).parent().removeClass('ouvert'); // fermeture des themes visibles, on enleve la class ouvert au <div> parent
            //$('#theme-images-'+themeid).stop(true).slideDown(timing).parent().addClass('ouvert'); // ouverture du theme, on ajoute la class ouvert au <div> parent
            $('div.theme.ouvert div.theme-images, div#theme-images-'+themeid).stop(true).slideToggle(timing).parent().toggleClass('ouvert'); // d'un coup
        }
    }//fin function aftheme()

    /** Avance d'une image */
    function avance() {
        if (actuelle<index.length-1) { // si on n'est pas à la dernière image
            actuelle++;
            aftheme(index[actuelle][0]);
            affiche(actuelle);
            return true;
        }
        else { return false; }
    }

    /** Recule d'une image */
    function recule() {
        if (actuelle>0) { // si on n'est pas à la première image
            actuelle--;
            aftheme(index[actuelle][0]);
            affiche(actuelle);
            return true;
        }
        else { return false; }
    }

    /** Gère swipe & pinch */
    function swipes() { // jquery.touchSwipe : https://github.com/mattbryson/TouchSwipe-Jquery-Plugin
        $('.cocoen-drag').addClass('noSwipe'); // bouger le slider ne mènera pas à un changement d'image
        $("body").swipe( {
            swipeDown:function(event, direction, distance, duration, fingerCount) {
                    recule();
            },
            swipeUp:function(event, direction, distance, duration, fingerCount) {
                    avance();
            },

            fingers:'all',
            threshold:75,
            maxTimeThreshold:500,
        });

    } // fin swipe()

    /** Gère la molette de souris pour image suivante/précedente */
    function wheel() {
        //ne pas passer par jQuery pour le {passive: true}
        document.body.addEventListener("wheel",function(e){
            if(e.ctrlKey==false && e.deltaY > 0 && actuelle<index.length-1 && Date.now() - scrolllast > delai) { // scroll suivant
                scrolllast = Date.now();
                avance();
            }
            if(e.ctrlKey==false && e.deltaY < 1 && actuelle>0 && Date.now() - scrolllast > delai) { // scroll précedent
                scrolllast = Date.now();
                recule();
            }
        }, {passive:true});
    } // fin wheel()


}); // fin jQuery
