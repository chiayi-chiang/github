let touXiang = function (url) {
    let Url = url || (Math.random()*8 | 0);
    switch (Url) {
        case 0 :
            return "icon-river__easyiconnet1";
        case 1 :
            return "icon-river__easyiconnet";
        case 2 :
            return "icon-photo_camera__easyiconnet";
        case 3 :
            return "icon-planet_earth__easyiconnet";
        case 4 :
            return "icon-palace__easyiconnet";
        case 5 :
            return "icon-mountain__easyiconnet";
        case 6 :
            return "icon-parachute__easyiconnet";
        case 7 :
            return "icon-map__easyiconnet";
        case 8 :
            return "icon-mountains__easyiconnet";
        case -1 :
            return "icon-yonghu"
    }
};



