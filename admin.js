// --- ADMINISTRATION PROFESSIONNELLE LONGRICH ---
// "Normes : Sécurité, Performance, Données Réelles"

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

// Récupérer les données
function getData(key, defaultVal = []) {
    const data = localStorage.getItem(key);
    try {
        return data ? JSON.parse(data) : defaultVal;
    } catch (e) {
        console.error("Erreur parsing JSON pour", key, e);
        return defaultVal;
    }
}

// Sauvegarder les données
function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error("Erreur sauvegarde localStorage", e);
        alert("Erreur de sauvegarde : Espace de stockage plein ?");
        return false;
    }
}

// 3. LOGIQUE DU DASHBOARD (AFFICHAGE)
// -----------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    setupEventListeners();
});

function initDashboard() {
    refreshStats();
    renderProductTable();
    fillSettingsForm();
    setupVersionCheck();
}

function switchTab(tabId) {
    // Gestionnaire d'onglets SPA (Single Page Application)
    document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.sidebar a').forEach(el => el.classList.remove('active'));
    
    const target = document.getElementById(tabId);
    if(target) target.classList.add('active');
    
    // Active le lien dans la sidebar
    const link = document.querySelector(`a[onclick="switchTab('${tabId}')"]`);
    if(link) link.classList.add('active');

    // Rafraîchir les données spécifiques
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

function handleProductSubmit() {
    try {
        const name = document.getElementById('p_name').value.trim();
        const price = document.getElementById('p_price').value;
        const cat = document.getElementById('p_cat').value;  // AJOUT CATÉGORIE
        const fileInput = document.getElementById('p_image_file');
        const desc = document.getElementById('p_desc').value.trim();

        if (!name || !price) {
            alert("Le nom et le prix sont obligatoires.");
            return;
        }

        // Fonction de traitement
        const processProduct = (imageBase64) => {
            let products = getData(STORAGE_KEY_PRODUCTS, []); // Default empty array, NO DEMO DATA
            
            const newProduct = {
                id: Date.now(),
                name: name,
                price: parseInt(price),
                category: cat || "Autre", 
                image: imageBase64 || "https://via.placeholder.com/400x300?text=No+Image",
                description: desc
            };

            products.push(newProduct);
            if (saveData(STORAGE_KEY_PRODUCTS, products)) {
                alert("Produit ajouté avec succès !");
                document.getElementById('product-form').reset();
                closeAddModal();
                renderProductTable();
                refreshStats();
            } else {
                alert("Impossible de sauvegarder le produit (stockage saturé ?)");
            }
        };

        // Gestion de l'image optimisée (Redimensionnement pour éviter saturation localStorage)
        if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const img = new Image();
                img.src = e.target.result;
                
                img.onload = function() {
                    // Création du canvas pour redimensionner
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 600; // Taille max raisonnable pour affichage web
                    const MAX_HEIGHT = 600;
                    let width = img.width;
                    let height = img.height;

                    // Calcul des nouvelles dimensions en gardant le ratio
                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Compression en JPEG qualité 70% pour gagner de la place
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    processProduct(compressedDataUrl);
                };
            };
            
            reader.onerror = function(err) {
                console.error("Erreur lecture image", err);
                alert("Erreur lors de la lecture de l'image.");
            };
            
            reader.readAsDataURL(file);
        } else {
            // Pas d'image ou URL (si on gardait l'option URL)
            processProduct(null);
        }
    } catch (error) {
        console.error("Erreur critique dans handleProductSubmit", error);
        alert("Une erreur inattendue est survenue : " + error.message);
    }
}

function deleteProduct(id) {
    if (confirm("Confirmer la suppression définitive de ce produit ?")) {
        let products = getData(STORAGE_KEY_PRODUCTS, []);
        products = products.filter(p => p.id !== id);
        saveData(STORAGE_KEY_PRODUCTS, products);
        renderProductTable();
        refreshStats();
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
