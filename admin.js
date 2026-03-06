// --- ADMINISTRATION PROFESSIONNELLE LONGRICH ---
// "Normes : Sécurité, Performance, Données Réelles"

const API_URL = 'https://script.google.com/macros/s/AKfycbzO471Itk4hSY9s0-9cjfJVdrIn8R_7oN-98kED-jZ0bugJjA3DVqlFgmHDQjjBEjfM4Q/exec';

// 1. SÉCURITÉ & AUTHENTIFICATION
// ----------------------------------------------------------------------------- 
const AUTH_KEY = 'longrich_admin_logged';
const STORAGE_KEY_PRODUCTS = 'longrich_products';
const STORAGE_KEY_SETTINGS = 'longrich_settings';
const STORAGE_KEY_STATS = 'longrich_stats';

// Vérification de la session au chargement
(function checkAuth() {
    if (!sessionStorage.getItem(AUTH_KEY)) {
        const pwd = prompt("ACCÈS RÉSERVÉ : Veuillez entrer le mot de passe Administrateur");
        if (pwd === "admin") {
            sessionStorage.setItem(AUTH_KEY, 'true');
        } else {
            alert("Accès refusé.");
            window.location.href = "index.html";
        }
    }
})();

// 2. GESTION DES DONNÉES (CRUD)
// -----------------------------------------------------------------------------

// Charger depuis le cloud
async function fetchCloudProducts() {
    try {
        const tbody = document.getElementById('products-table-body');
        if(tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Chargement depuis Google Sheets... <i class="fas fa-spinner fa-spin"></i></td></tr>';

        const response = await fetch(API_URL);
        const products = await response.json();
        
        // Sauvegarde locale pour le dashboard
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
        renderProductTable();
        refreshStats();
    } catch (error) {
        console.error("Erreur chargement cloud", error);
        alert("Erreur de connexion à Google Sheets");
    }
}

// Récupérer les données locales
function getData(key, defaultVal = []) {
    const data = localStorage.getItem(key);
    try {
        return data ? JSON.parse(data) : defaultVal;
    } catch (e) {
        return defaultVal;
    }
}

// Sauvegarder les données
function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
}

// 3. LOGIQUE DU DASHBOARD (AFFICHAGE)
// -----------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    setupEventListeners();
});

function initDashboard() {
    fetchCloudProducts(); // Charger les vraies données immédiatement
    refreshStats();
    // renderProductTable appelé par fetchCloudProducts
    fillSettingsForm();
}

function switchTab(tabId) {
    document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.sidebar a').forEach(el => el.classList.remove('active'));
    
    const target = document.getElementById(tabId);
    if(target) target.classList.add('active');
    
    const link = document.querySelector(`a[onclick="switchTab('${tabId}')"]`);
    if(link) link.classList.add('active');

    if(tabId === 'dashboard') refreshStats();
}

// 4. MODULE PRODUITS
// -----------------------------------------------------------------------------

function renderProductTable() {
    const products = getData(STORAGE_KEY_PRODUCTS, []);
    const settings = getData(STORAGE_KEY_SETTINGS, { currency: "FCFA" });
    const tbody = document.getElementById('products-table-body');
    
    if (!tbody) return;
    tbody.innerHTML = '';

    if (products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:40px; color:#7f8c8d;">
            <i class="fas fa-box-open" style="font-size:2rem; margin-bottom:10px;"></i><br>
            Aucun produit.<br>Cliquez sur "Nouveau Produit" pour commencer.
        </td></tr>`;
        return;
    }

    products.forEach(p => {
        tbody.innerHTML += `
            <tr>
                <td><img src="${p.image}" class="product-img-mini" alt="Img" onerror="this.src='https://via.placeholder.com/50'"></td>
                <td><strong>${p.name}</strong><br><small style="color:#7f8c8d">${p.description ? p.description.substring(0, 30)+'...' : ''}</small></td>
                <td style="color:var(--primary); font-weight:bold;">${parseInt(p.price).toLocaleString()} ${settings.currency || 'FCFA'}</td>
                <td>
                    <button class="btn btn-danger" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
}

async function handleProductSubmit() {
    const name = document.getElementById('p_name').value.trim();
    const price = document.getElementById('p_price').value;
    const cat = document.getElementById('p_cat').value; 
    const desc = document.getElementById('p_desc').value.trim();
    
    // Récupérer l'URL de l'image ou utiliser une image par défaut
    const urlInput = document.getElementById('p_image_url');
    let imageUrl = urlInput && urlInput.value.trim() ? urlInput.value.trim() : "https://via.placeholder.com/400x300?text=" + encodeURIComponent(name);

    if (!name || !price) {
        alert("Nom et prix requis");
        return;
    }

    const btn = document.querySelector('#product-form button');
    if(btn) btn.innerText = "Envoi en cours...";

    const newProduct = {
        action: "add",
        id: Date.now(),
        name: name,
        price: price,
        category: cat,
        image: imageUrl, 
        description: desc
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors', // Important pour Google Apps Script simple
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProduct)
        });
        
        // Avec no-cors on ne peut pas lire la réponse, on assume que ça marche
        alert("Produit envoyé à Google Sheet !");
        
        // Mise à jour locale optimiste
        let products = getData(STORAGE_KEY_PRODUCTS, []);
        products.push(newProduct);
        saveData(STORAGE_KEY_PRODUCTS, products);
        
        document.getElementById('product-form').reset();
        closeAddModal();
        renderProductTable();
        refreshStats();
        
        // Recharger le cloud après un court délai pour être sûr
        setTimeout(fetchCloudProducts, 2000);

    } catch (error) {
        console.error("Erreur envoi", error);
        alert("Erreur lors de l'envoi : " + error.message);
    } finally {
        if(btn) btn.innerText = "Sauvegarder";
    }
}

async function deleteProduct(id) {
    if (!confirm("Supprimer ce produit de Google Sheet ?")) return;

    // Optimiste : supprimer localement tout de suite
    let products = getData(STORAGE_KEY_PRODUCTS, []);
    products = products.filter(p => p.id != id);
    saveData(STORAGE_KEY_PRODUCTS, products);
    renderProductTable();

    try {
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: "delete", id: id })
        });
        console.log("Ordre de suppression envoyé");
    } catch (error) {
        alert("Erreur réseau suppression");
    }
}


// 5. MODULE STATISTIQUES & ANALYSE
// -----------------------------------------------------------------------------
function refreshStats() {
    const products = getData(STORAGE_KEY_PRODUCTS, []);
    
    // Mise à jour des compteurs "Live"
    const countEl = document.getElementById('stat-products-count');
    if(countEl) countEl.innerText = products.length;
}

// 6. MODULE PARAMÈTRES (15 MEILLEURS PARAMÈTRES)
// -----------------------------------------------------------------------------
function fillSettingsForm() {
    // Valeurs par défaut vides, pas de démo
    const settings = getData(STORAGE_KEY_SETTINGS, {}); 

    const fields = [
        's_site_name', 's_tagline', 's_primary_color', 's_currency',
        's_whatsapp', 's_email', 's_facebook', 's_instagram',
        's_delivery_fee', 's_free_shipping', 's_delivery_time', 's_location',
        's_hero_title', 's_promo_bar', 's_footer_text'
    ];

    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            // Clé JSON = id sans le préfixe 's_'
            const key = id.replace('s_', '');
            el.value = settings[key] || '';
        }
    });
}

function saveSettings(e) {
    e.preventDefault();
    
    const fields = [
        's_site_name', 's_tagline', 's_primary_color', 's_currency',
        's_whatsapp', 's_email', 's_facebook', 's_instagram',
        's_delivery_fee', 's_free_shipping', 's_delivery_time', 's_location',
        's_hero_title', 's_promo_bar', 's_footer_text'
    ];

    const newSettings = {};
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const key = id.replace('s_', '');
            newSettings[key] = el.value.trim();
        }
    });
    
    saveData(STORAGE_KEY_SETTINGS, newSettings);
    alert("Paramètres mis à jour ! Le site est maintenant synchronisé.");
}

// 7. UTILITAIRES UI
// -----------------------------------------------------------------------------
function openAddModal() {
    document.getElementById('add-product-panel').style.display = 'block';
}

function closeAddModal() {
    document.getElementById('add-product-panel').style.display = 'none';
}

function setupEventListeners() {
    window.switchTab = switchTab;
    window.openAddModal = openAddModal;
    window.closeAddModal = closeAddModal;
    window.handleProductSubmit = handleProductSubmit;
    window.deleteProduct = deleteProduct;
    window.saveSettings = saveSettings;
}

function setupVersionCheck() {
    console.log("Admin Dashboard Longrich Pro v2.0 READY");
}

// [CLEANED]

// [CLEANED]

// [CLEANED]

