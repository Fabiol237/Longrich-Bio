// --- CONFIGURATION SITES ---
const DATA_VERSION = 'v1.5'; // Mise à jour API

// LIEN API GOOGLE SCRIPT (Lecture & Écriture)
const API_URL = 'https://script.google.com/macros/s/AKfycbzO471Itk4hSY9s0-9cjfJVdrIn8R_7oN-98kED-jZ0bugJjA3DVqlFgmHDQjjBEjfM4Q/exec';

const REAL_PRODUCTS = []; // Obsolète

function getSettings() {
    return JSON.parse(localStorage.getItem('longrich_settings')) || { currency: "FCFA" };
}
function initData() {
    if (!localStorage.getItem('longrich_settings')) {
        localStorage.setItem('longrich_settings', JSON.stringify({ currency: "FCFA" }));
    }
}

function getProducts() {
    return JSON.parse(localStorage.getItem('longrich_products')) || [];
}

// Afficher les produits (Page d'accueil)
function renderProducts() {
    initData(); 
    renderFilteredProducts();
    syncProductsFromCloud(); // Charge depuis l'API
}

// --- SYNC API CLOUD ---
async function syncProductsFromCloud() {
    if(!API_URL) return;
    try {
        console.log("Chargement API Cloud...");
        const response = await fetch(API_URL); // Le doGet renvoie du JSON
        const products = await response.json();
        
        if(products && Array.isArray(products)) {
            // Normalisation des données
            const cleanProducts = products.map(p => ({
                id: p.id,
                name: p.name,
                price: parseInt(p.price) || 0,
                category: p.category || "Autre",
                image: p.image || "https://via.placeholder.com/400x300?text=Produit",
                description: p.description || ""
            }));

            localStorage.setItem('longrich_products', JSON.stringify(cleanProducts));
            console.log("✅ Produits synchronisés :", cleanProducts.length);
            renderFilteredProducts();
        }
    } catch (e) {
        console.error("Erreur sync API:", e);
    }
}

// Ancienne fonction CSV supprimée car l'API renvoie du JSON propre






// --- FONCTIONS ADMIN OBSOLÈTES (Gérées par admin.js maintenant) ---
// renderAdminProducts, addProduct supprimées pour éviter doublons et confusion.

function applySiteSettings() {
    const settings = JSON.parse(localStorage.getItem('longrich_settings')) || {};
    
    // 1. TITRE DU SITE & LOGO
    if (settings.site_name) {
        document.title = settings.site_name + " - Boutique Officielle";
        const logo = document.getElementById('site-logo');
        if (logo) {
            // Essaie de garder le style "Bio" en gras si le nom contient 2 mots
            const parts = settings.site_name.split(' ');
            if (parts.length > 1) {
                const last = parts.pop();
                logo.innerHTML = parts.join(' ') + ` <span>${last}</span>`;
            } else {
                logo.innerText = settings.site_name;
            }
        }
    }

    // 2. COULEURS (Thème Dynamique)
    if (settings.primary_color) {
        document.documentElement.style.setProperty('--primary', settings.primary_color);
        // Assombrir légèrement pour le hover
        document.documentElement.style.setProperty('--dark', shadeColor(settings.primary_color, -20));
    }

    // 3. HERO SECTION
    const heroTitle = document.getElementById('hero-title');
    if (heroTitle && settings.hero_title) {
        heroTitle.innerText = settings.hero_title;
    }
    const subTitle = document.getElementById('hero-tagline');
    if (subTitle && settings.tagline) {
        subTitle.innerText = settings.tagline;
    }

    // --- NOUVELLES FONCTIONNALITÉS (PRO) ---

    // 4. BARRE DE PROMOTION (Top Bar)
    const topBar = document.getElementById('top-promo-bar');
    const promoText = document.getElementById('promo-text');
    if (topBar && promoText) {
        if (settings.promo_bar && settings.promo_bar.trim() !== "") {
            promoText.textContent = settings.promo_bar;
            topBar.style.display = 'block';
        } else {
            topBar.style.display = 'none';
        }
    }

    // 5. PIED DE PAGE (Marque & Slogan)
    const footerBrand = document.getElementById('footer-brand');
    const footerText = document.getElementById('footer-text');
    if (footerBrand) footerBrand.textContent = settings.site_name || "Longrich";
    if (footerText) footerText.textContent = settings.footer_text || "Votre santé, notre priorité.";

    // 6. RÉSEAUX SOCIAUX & CONTACT
    const socialContainer = document.getElementById('social-container');
    if (socialContainer) {
        socialContainer.innerHTML = ''; // Reset
        
        // WhatsApp (Vital pour Longrich)
        if (settings.whatsapp) {
            // Nettoyage du numéro
            const cleanNum = settings.whatsapp.replace(/\D/g,'');
            const waLink = `https://wa.me/${cleanNum}`;
            
            // Lien "Rejoindre l'équipe"
            const btnJoin = document.getElementById('join-btn');
            if(btnJoin) btnJoin.href = waLink + "?text=Bonjour, je souhaite rejoindre votre équipe Longrich et devenir distributeur.";
            
            // Icône Footer
            socialContainer.innerHTML += `<a href="${waLink}" target="_blank" style="color:white; transition:0.3s;"><i class="fab fa-whatsapp"></i></a>`;
            
            // Floating Widget mis à jour
            const float = document.getElementById('wa-float');
            if(float) float.href = waLink + "?text=Bonjour, je suis intéressé par vos produits.";
        }
        
        // Facebook
        if (settings.facebook) {
             socialContainer.innerHTML += `<a href="${settings.facebook}" target="_blank" style="color:white; transition:0.3s;"><i class="fab fa-facebook-f"></i></a>`;
        }
        
        // Instagram
        if (settings.instagram) {
             socialContainer.innerHTML += `<a href="${settings.instagram}" target="_blank" style="color:white; transition:0.3s;"><i class="fab fa-instagram"></i></a>`;
        }
    }

    // 7. COPYRIGHT
    const yearSpan = document.getElementById('year');
    if(yearSpan) yearSpan.textContent = new Date().getFullYear();
    const copyName = document.getElementById('footer-copy');
    if(copyName) copyName.textContent = settings.site_name || "Longrich Admin";
}

// Helper pour assombrir la couleur (Dark Variant)
function shadeColor(color, percent) {
    var R = parseInt(color.substring(1,3),16);
    var G = parseInt(color.substring(3,5),16);
    var B = parseInt(color.substring(5,7),16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R<255)?R:255;  
    G = (G<255)?G:255;  
    B = (B<255)?B:255;  

    var RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
    var GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
    var BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
}

// --- SYSTEME WHATSAPP CENTRALISÉ ---
// Met à jour TOUS les liens WhatsApp du site avec le numéro configuré
function updateAllWhatsAppLinks() {
    const settings = JSON.parse(localStorage.getItem('longrich_settings')) || {};
    const whatsappNum = settings.whatsapp; // Ex: "237699..."

    if (!whatsappNum) return; 

    const cleanNum = whatsappNum.replace(/[^0-9]/g, ''); // Garde que les chiffres

    // 1. Trouve tous les liens contenant 'wa.me' ou 'whatsapp.com'
    const waLinks = document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp.com"]');

    waLinks.forEach(link => {
        try {
            // On veut conserver le message (?text=...) s'il existe
            let originalUrl = link.href;
            let textParam = "";
            
            if (originalUrl.includes('text=')) {
                textParam = "?text=" + originalUrl.split('text=')[1].split('&')[0]; // Récupère le message
            }
            
            // Construit le nouveau lien
            link.href = `https://wa.me/${cleanNum}${textParam}`;
        } catch (e) {
            console.error("Erreur update lien WA", e);
        }
    });
    
    // 2. Trouve les éléments avec la classe .btn-whatsapp (au cas où)
    document.querySelectorAll('.btn-whatsapp').forEach(btn => {
        if (btn.tagName === 'A') {
             btn.href = `https://wa.me/${cleanNum}`;
        }
    });

    console.log("✅ Tous les liens WhatsApp pointent maintenant vers : " + cleanNum);
}

// Lancer après le chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(updateAllWhatsAppLinks, 500); 
});

function deleteProduct(index) {
    if(confirm('Supprimer ce produit ?')) {
        const products = getProducts();
        products.splice(index, 1);
        localStorage.setItem('longrich_products', JSON.stringify(products));
        renderAdminProducts();
    }
}


// Récupérer le panier
function getCart() {
    return JSON.parse(localStorage.getItem('longrich_cart')) || [];
}

// Sauvegarder le panier
function saveCart(cart) {
    localStorage.setItem('longrich_cart', JSON.stringify(cart));
}

// Fonction Toast globale
window.showToast = function(message) {
    let toast = document.getElementById("toast");
    if (!toast) return; 
    toast.textContent = message;
    toast.className = "show";
    setTimeout(function(){ toast.className = toast.className.replace("show", ""); }, 3000);
}

// Ajouter au panier
function addToCart(id, btn, quantity = 1) {
    const products = getProducts();
    // String vs Number ID pour être sûr
    const product = products.find(p => p.id == id);
    let cart = getCart();

    if (!product) { 
        console.error("Produit non trouvé:", id); 
        return; 
    }

    const existing = cart.find(item => item.id == id);
    if (existing) {
        existing.qty = parseInt(existing.qty) + parseInt(quantity);
        showToast(`Quantité mise à jour (+${quantity}) - ${product.name}`);
    } else {
        cart.push({...product, qty: parseInt(quantity)});
        showToast("Ajouté au panier ! 🛒");
    }

    saveCart(cart);
    updateCartIcon(); // Si une icône existe quelque part
    
    // Animation Bouton (optionnel, pour l'UX)
    if (btn) {
        const originalContent = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> OK';
        btn.style.background = '#27ae60';
        setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.style.background = '';
        }, 1500);
    }
}

// Mettre à jour l'icône (badge) si existant
function updateCartIcon() {
    const cart = getCart();
    const count = cart.reduce((acc, item) => acc + parseInt(item.qty), 0);
    const badge = document.getElementById('cart-count');
    if (badge) badge.innerText = count;
}

// --- LOGIQUE PAGE DE LIVRAISON (AMÉLIORÉE) ---

function renderCartPage() {
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    
    // Si on n'est pas sur la page panier, on arrête
    if (!container) return;

    const cart = getCart();
    container.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:30px; background:#f9f9f9; border-radius:10px;">
                <i class="fas fa-shopping-basket" style="font-size:3rem; color:#ddd; margin-bottom:15px;"></i>
                <p>Votre panier est vide.</p>
                <a href="index.html" class="btn" style="background:#3498db; margin-top:10px; display:inline-block;">Retour aux produits</a>
            </div>`;
        if(totalEl) totalEl.innerText = "0 FCFA";
        // Désactiver le bouton commander ?
        return;
    }

    cart.forEach(item => {
        const itemPrice = parseInt(item.price) || 0;
        const itemQty = parseInt(item.qty) || 1;
        const subtotal = itemPrice * itemQty;
        total += subtotal;

        // Image par défaut si manquante
        const imgUrl = item.image ? item.image : 'https://via.placeholder.com/50';

        container.innerHTML += `
            <div class="cart-item" style="display:flex; justify-content:space-between; align-items:center; padding:15px; border-bottom:1px solid #eee;">
                
                <div style="display:flex; align-items:center; gap:15px; flex:1;">
                    <img src="${imgUrl}" style="width:60px; height:60px; object-fit:cover; border-radius:8px; border:1px solid #eee;" alt="${item.name}">
                    <div class="cart-info">
                        <h4 style="margin:0; color:#2c3e50;">${item.name}</h4>
                        <p style="margin:0; font-size:0.9rem; color:#7f8c8d;">${itemPrice.toLocaleString()} FCFA / unité</p>
                    </div>
                </div>

                <div style="display:flex; align-items:center; gap:15px;">
                    <!-- Contrôles Quantité -->
                    <div class="quantity-controls" style="display:flex; align-items:center; background:#f0f2f5; border-radius:20px; padding:2px 5px;">
                        <button class="qty-btn" type="button" onclick="updateItemQuantity(${item.id}, -1)" style="border:none; width:30px; height:30px; border-radius:50%; cursor:pointer;">-</button>
                        <span class="qty-display" style="min-width:30px; text-align:center; font-weight:bold;">${itemQty}</span>
                        <button class="qty-btn" type="button" onclick="updateItemQuantity(${item.id}, 1)" style="border:none; width:30px; height:30px; border-radius:50%; cursor:pointer;">+</button>
                    </div>

                    <div class="item-total" style="font-weight:bold; min-width:90px; text-align:right;">
                        ${subtotal.toLocaleString()} FCFA
                    </div>

                    <button class="remove-btn" type="button" onclick="removeItem(${item.id})" title="Retirer" style="color:#e74c3c; background:none; border:none; cursor:pointer; font-size:1.2rem; margin-left:10px;">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>

            </div>
        `;
    });

    if (totalEl) totalEl.innerHTML = `<span style="color:#7f8c8d; font-size:1rem; font-weight:normal;">Total à payer :</span> ${total.toLocaleString()} FCFA`;
    
    // Initialise la carte si nécessaire
    initDeliveryMap();
}

// Modifier la quantité (+/-)
function updateItemQuantity(id, delta) {
    let cart = getCart();
    const item = cart.find(p => p.id == id);

    if (item) {
        const newQty = parseInt(item.qty) + delta;
        if (newQty <= 0) {
            // Si 0, demander confirmation suppression
            removeItem(id);
        } else {
            item.qty = newQty;
            saveCart(cart);
            renderCartPage(); // Rafraîchir l'affichage
            showToast("Panier mis à jour");
        }
    }
}

// Supprimer un article
function removeItem(id) {
    if(confirm("Retirer cet article du panier ?")) {
        let cart = getCart();
        cart = cart.filter(p => p.id != id);
        saveCart(cart);
        renderCartPage();
        updateCartIcon();
        showToast("Article retiré");
    }
}

// Initialisation Carte (Vérif plus robuste)
let mapInstance = null;
function initDeliveryMap() {
    const mapEl = document.getElementById('map');
    
    // Si carte déjà chargée ou élément absent ou Leaflet absent, on sort
    if (!mapEl || typeof L === 'undefined' || mapInstance) return;

    try {
        // Douala par défaut
        const defaultLat = 4.051056;
        const defaultLng = 9.767869;

        // On utilise la couche Satellite ESRI (gratuit, joli)
        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri',
            maxZoom: 18
        });

        mapInstance = L.map('map', {
            center: [defaultLat, defaultLng],
            zoom: 13,
            layers: [satelliteLayer],
            scrollWheelZoom: false // Pour ne pas gêner le scroll de la page
        });

        // Marqueur déplaçable
        const marker = L.marker([defaultLat, defaultLng], {draggable: true}).addTo(mapInstance);

        // Mise à jour des coordonnées
        const updateCoords = (lat, lng) => {
            document.getElementById('c-lat').value = lat.toFixed(6);
            document.getElementById('c-lng').value = lng.toFixed(6);
        };
        // Initial
        updateCoords(defaultLat, defaultLng);

        // Quand on bouge le marqueur
        marker.on('dragend', function(e) {
            const pos = e.target.getLatLng();
            updateCoords(pos.lat, pos.lng);
        });

        // Quand on clique sur la carte
        mapInstance.on('click', function(e) {
            marker.setLatLng(e.latlng);
            updateCoords(e.latlng.lat, e.latlng.lng);
        });

        // Géolocalisation (si autorisé)
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(position => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                mapInstance.setView([lat, lng], 15);
                marker.setLatLng([lat, lng]);
                updateCoords(lat, lng);
            }, (err) => {
                console.log("Géolocalisation refusée ou erreur");
            });
        }
    } catch (e) {
        console.error("Erreur chargement carte", e);
        mapEl.innerHTML = '<p style="text-align:center; padding:20px;">Impossible de charger la carte. Continuez sans.</p>';
        mapInstance = true; // Pour éviter de réessayer en boucle
    }
}

// Envoi WhatsApp Robuste
function sendWhatsapp(event) {
    if (event) event.preventDefault();

    const cart = getCart();
    if (cart.length === 0) {
        alert("Votre panier est vide !");
        return;
    }

    const name = document.getElementById('c-name').value.trim();
    const address = document.getElementById('c-address').value.trim();
    
    if (!name || !address) {
        alert("Merci de remplir votre nom et votre adresse/quartier.");
        return;
    }

    const lat = document.getElementById('c-lat').value;
    const lng = document.getElementById('c-lng').value;
    
    // Récupérer le numéro WhatsApp (Paramètres > Défaut)
    const settings = JSON.parse(localStorage.getItem('longrich_settings')) || {};
    // Fallback number si non configuré
    let phone = settings.whatsapp ? settings.whatsapp.replace(/[^0-9]/g, '') : "237699999999"; 

    // Construction du message
    let msg = `*🚀 NOUVELLE COMMANDE LONGRICH*\n\n`;
    msg += `👤 *Client:* ${name}\n`;
    msg += `🏠 *Lieu:* ${address}\n`;
    
    if (lat && lng && lat !== "0" && lng !== "0") {
        msg += `📍 *GPS:* https://www.google.com/maps?q=${lat},${lng}\n`;
    }
    
    msg += `\n🛒 *ARTICLES COMMANDÉS:*\n`;
    
    let total = 0;
    cart.forEach(item => {
        const itemPrice = parseInt(item.price) || 0;
        const itemQty = parseInt(item.qty) || 1;
        const lineTotal = itemPrice * itemQty;
        //const lineTotal = item.price * item.qty;
        total += lineTotal;
        msg += `- ${item.name} (x${itemQty}) : *${lineTotal.toLocaleString()} FCFA*\n`;
    });
    
    msg += `\n💰 *TOTAL À PAYER:* ${total.toLocaleString()} FCFA\n`;
    msg += `\n_Envoyé depuis la boutique en ligne._`;

    // Ouverture WhatsApp
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
    
    // Vider le panier après envoi réussi
    // On demande confirmation avant de vider ? Non, on vide et on redirige.
    localStorage.removeItem('longrich_cart');
    window.location.href = 'index.html'; // Retour accueil
}


// --- FILTRES ET RECHERCHE ---
// Variables globales pour le filtrage
let currentCategory = 'Tout';
let currentSort = 'name';

// Fonction commune pour rendre les produits filtrés et triés
function renderFilteredProducts() {
    const products = getProducts();
    const grid = document.getElementById('products-grid');
    if(!grid) return;
    grid.innerHTML = '';
    
    if (products.length === 0) {
        grid.innerHTML = '<p style="text-align:center; width:100%; color:#7f8c8d; font-size:1.2rem; padding:40px;">Aucun produit disponible (Maintenance de la boutique).</p>';
        return;
    }
    
    let filtered = products;
    
    // Filtrer par catégorie
    if (currentCategory !== 'Tout') {
        filtered = filtered.filter(p => p.category && p.category.includes(currentCategory));
    }
    
    // Filtrer par recherche
    const search = document.getElementById('search-input').value.toLowerCase().trim();
    if (search) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(search) || (p.description && p.description.toLowerCase().includes(search)));
    }
    
    // Trier
    if (currentSort === 'price-asc') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (currentSort === 'price-desc') {
        filtered.sort((a, b) => b.price - a.price);
    } else {
        // Trier par nom par défaut
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    if(filtered.length === 0) {
        grid.innerHTML = '<p style="text-align:center; width:100%;">Aucun résultat.</p>';
        return;
    }

    const settings = getSettings();
    const currency = settings.currency || "FCFA";
    filtered.forEach((product, index) => {
        if(window.generateProductHTML) {
            grid.innerHTML += window.generateProductHTML(product, index);
        }
    });
}

window.filterByCat = function(category) {
    currentCategory = category;
    
    // UI Boutons
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    const btns = document.querySelectorAll('.filter-btn');
    for(let b of btns) { if(b.innerText === category) b.classList.add('active'); }
    
    renderFilteredProducts();
}

window.filterProducts = function() {
    renderFilteredProducts();
}

// Fonction pour appliquer le tri
window.applySorting = function() {
    const select = document.getElementById('sort-select');
    currentSort = select.value;
    renderFilteredProducts();
}

// Fonction d'autocomplétion
window.showSuggestions = function() {
    const input = document.getElementById('search-input');
    const suggestionsDiv = document.getElementById('suggestions');
    const query = input.value.toLowerCase().trim();
    
    // Toujours filtrer les produits
    filterProducts();
    
    if (query === '') {
        suggestionsDiv.style.display = 'none';
        return;
    }
    
    const products = getProducts();
    const matches = products.filter(p => p.name.toLowerCase().startsWith(query)).slice(0, 5); // Limite à 5 suggestions
    
    if (matches.length === 0) {
        suggestionsDiv.style.display = 'none';
        return;
    }
    
    suggestionsDiv.innerHTML = '';
    matches.forEach(product => {
        const div = document.createElement('div');
        div.textContent = product.name;
        div.style.padding = '10px';
        div.style.cursor = 'pointer';
        div.style.borderBottom = '1px solid #eee';
        div.onmouseover = () => div.style.backgroundColor = '#f8f9fa';
        div.onmouseout = () => div.style.backgroundColor = 'white';
        div.onclick = () => {
            input.value = product.name;
            suggestionsDiv.style.display = 'none';
            filterProducts(); // Filtrer immédiatement
        };
        suggestionsDiv.appendChild(div);
    });
    
    suggestionsDiv.style.display = 'block';
}

// Cacher les suggestions au clic ailleurs
document.addEventListener('click', function(e) {
    const suggestions = document.getElementById('suggestions');
    const input = document.getElementById('search-input');
    if (e.target !== input && !suggestions.contains(e.target)) {
        suggestions.style.display = 'none';
    }
});

// --- HELPER HTML GENERATION (Global) ---
window.generateProductHTML = function(product, index) {
    const settings = JSON.parse(localStorage.getItem('longrich_settings')) || { currency: "FCFA" };
    const currency = settings.currency || "FCFA";
    
    // Pas de description sur l'accueil
    return `
            <div class="product-card" style="animation-delay: ${index * 0.1}s">
                <div class="img-container" onclick="openProductModal('${product.id}')" style="cursor: pointer;">
                    <img src="${product.image}" alt="${product.name}" class="product-img">
                </div>
                <div class="product-info">
                    <h3 class="product-title" onclick="openProductModal('${product.id}')" style="cursor: pointer;">${product.name}</h3>
                    
                    <div class="product-actions-row">
                        <div class="product-price-big">${parseInt(product.price).toLocaleString()} ${currency}</div>
                        <button class="btn-add-cart" onclick="addToCart(${product.id}, this)" title="Ajouter au panier">
                            <i class="fas fa-shopping-basket"></i> Ajouter au panier
                        </button>
                    </div>
                </div>
            </div>
    `;
};


// --- INITIALISATION ---
document.addEventListener('DOMContentLoaded', () => {
    initData();
    applySiteSettings();
    updateCartIcon();
    renderProducts();
    
    // Configurer le bouton WhatsApp flottant
    const waFloat = document.getElementById('wa-float');
    if (waFloat) {
        const settings = JSON.parse(localStorage.getItem('longrich_settings')) || {};
        const phone = (settings.whatsapp || '237699999999').replace(/[^0-9]/g, '');
        waFloat.href = 'https://wa.me/' + phone + '?text=Bonjour, j\'ai une question sur vos produits.';
    }

    renderCartPage();

    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) checkoutForm.addEventListener('submit', sendWhatsapp);
    
    if(document.getElementById('search-input')) {
        document.getElementById('search-input').addEventListener('input', showSuggestions);
    }
});

/* --- GESTION DU MODAL PRODUIT 2.0 (Pro) --- */
window.adjustModalQty = function(change) {
    const input = document.getElementById('modal-qty');
    if(!input) return;
    let val = parseInt(input.value);
    val += change;
    if (val < 1) val = 1;
    input.value = val;
}

window.openProductModal = function(id) {
    const products = getProducts();
    const product = products.find(p => p.id == id);
    if (!product) return;

    // Reset Quantit�
    const qtyInput = document.getElementById('modal-qty');
    if(qtyInput) qtyInput.value = 1;

    // Donn�es
    const imgApi = document.getElementById('modal-img');
    if(imgApi) {
        imgApi.style.opacity = '0';
        imgApi.src = product.image;
        imgApi.onload = () => imgApi.style.opacity = '1';
    }

    const titleEl = document.getElementById('modal-title');
    if(titleEl) titleEl.textContent = product.name;
    
    const descEl = document.getElementById('modal-desc');
    if(descEl) descEl.innerHTML = (product.description || 'Aucune description disponible.').replace(/<script.*?>.*?<\/script>/gi, '');
    
    const settings = JSON.parse(localStorage.getItem('longrich_settings')) || { currency: 'FCFA' };
    const currency = settings.currency || 'FCFA';
    const priceEl = document.getElementById('modal-price');
    if(priceEl) priceEl.textContent = parseInt(product.price).toLocaleString() + ' ' + currency;

    const addBtn = document.getElementById('modal-add-btn');
    if(addBtn) {
        const newBtn = addBtn.cloneNode(true);
        addBtn.parentNode.replaceChild(newBtn, addBtn);
        newBtn.onclick = function() {
            const qInput = document.getElementById('modal-qty');
            const qty = qInput ? parseInt(qInput.value) : 1;
            addToCart(product.id, this, qty);
        };
    }

    const modal = document.getElementById('product-modal');
    if(modal) {
        modal.style.display = 'block';
        setTimeout(() => { modal.classList.add('show'); }, 10);
    }
    document.body.style.overflow = 'hidden';
}

window.closeProductModal = function() {
    const modal = document.getElementById('product-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    }
}

document.addEventListener('click', function(event) {
    const modal = document.getElementById('product-modal');
    if (event.target === modal || event.target.closest('.close-modal')) {
        if(modal && modal.style.display === 'block') closeProductModal();    
    }
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') closeProductModal();
});


// --- INITIALISATION PROPRE DU PANIER & COMMANDES ---

function initContactPage() {
    // Cette fonction ne s'execute que si les elements existent (donc page contact)
    const settings = JSON.parse(localStorage.getItem("longrich_settings")) || {};
    
    // 1. WhatsApp Specifique Contact
    const waBtn = document.getElementById("contact-wa-btn");
    if (waBtn && settings.whatsapp) {
        const num = settings.whatsapp.replace(/[^0-9]/g, "");
        waBtn.href = "https://wa.me/" + num + "?text=Bonjour, je souhaite vous contacter pour une commande ou un partenariat.";
        waBtn.innerHTML = '<i class="fab fa-whatsapp"></i> Discuter sur WhatsApp (' + settings.whatsapp + ')';
    }

    // 2. Email
    const mailEl = document.getElementById("contact-email");
    if (mailEl) {
        const email = settings.email;
        if (email) {
            mailEl.innerHTML = '<a href="mailto:' + email + '" style="color:green; font-weight:bold;">' + email + '</a>';
        } else {
            mailEl.innerText = "Non configuré";
        }
    }

    // 3. Localisation
    const locEl = document.getElementById("contact-location");
    if (locEl) {
        locEl.innerText = settings.location ? settings.location : "Cameroun (Livraison nationale)";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialiser le panier s'il existe sur cette page
    if (document.getElementById('cart-items')) {
        renderCartPage();
    }
    
    // 2. Initialiser l'icône du panier
    updateCartIcon();

    // 3. Attacher l'evenement au formulaire de commande
    const form = document.getElementById('checkout-form');
    if (form) {
        form.addEventListener('submit', sendWhatsapp);
    }

    // 4. Initialiser la page contact si necessaire
    initContactPage();
});



