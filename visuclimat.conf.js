/* * * * * * * * * * * * * * * * * * * * *
 * VisuClimat - Fichier de configuration
 * * * * * * * * * * * * * * * * * * * * */

/** Dossier contenant les images */
const basedir = "img/";

/** Mode tactile : pointeurs de souris cachés */
const tactile = false;

/** Image affichée si aucun paramètre n'est fourni (comptée à partir de 0) */
const pardefaut = 1;

/** Configuration des images */
const elems = [

    {   // Déforestation
        "theme"     :   "Déforestation",
        "images" :  
        [
            {   // Argentine
                "lieu"          :   "Argentine",
                "avant"         :   "Déforestation - Argentine - a.jpg",
                "apres"         :   "Déforestation - Argentine - b.jpg",
                "credit"        :   "Source : USGS", 
                "titre"         :   "Déforestation en Argentine",
                "legende"       :   "L'extension de l'agriculture dans cette région centrale de l'Argentine est visible.",
                "avant-date"    :   "Janvier 1994",
                "apres-date"    :   "Janvier 2014",
            },              
            {   // Brésil
                "lieu"          :   "Brésil",
                "avant"         :   "Déforestation - Brésil - a.jpg",
                "apres"         :   "Déforestation - Brésil - b.jpg",
                "credit"        :   "Source : USGS",
                "titre"         :   "Déforestation et construction d'un barrage au Brésil",
                "legende"       :   "Le barrage Samuel Dam a été construit sur la rivière Jamari en 1985.",
                "avant-date"    :   "Juin 1984",
                "apres-date"    :   "Août 2011",
            },  
        ]
    }
];