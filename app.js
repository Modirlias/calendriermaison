// Application de gestion de planning familial gothique

class PlanningApp {
    constructor() {
        this.currentDate = new Date();
        this.users = [];
        this.appointments = [];
        this.shoppingListsHousehold = []; // Listes de courses par foyer
        this.shoppingListsPersonal = {}; // Listes de courses personnelles {userId: []}
        this.households = []; // Foyers
        this.selectedColor = '#b19cd9';
        this.currentAppointmentDate = null;
        this.currentAppointmentId = null;
        this.currentHouseholdId = null; // Foyer actuellement sélectionné pour la liste de courses
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.renderCalendar();
        this.renderUsersList();
        this.populateUserSelect();
    }

    // Stockage et chargement des données
    loadData() {
        const storedUsers = localStorage.getItem('users');
        const storedAppointments = localStorage.getItem('appointments');
        const storedShoppingListsHousehold = localStorage.getItem('shoppingListsHousehold');
        const storedShoppingListsPersonal = localStorage.getItem('shoppingListsPersonal');
        const storedHouseholds = localStorage.getItem('households');
        const storedCurrentHouseholdId = localStorage.getItem('currentHouseholdId');
        
        this.users = storedUsers ? JSON.parse(storedUsers) : [];
        this.appointments = storedAppointments ? JSON.parse(storedAppointments) : [];
        this.shoppingListsHousehold = storedShoppingListsHousehold ? JSON.parse(storedShoppingListsHousehold) : [];
        this.shoppingListsPersonal = storedShoppingListsPersonal ? JSON.parse(storedShoppingListsPersonal) : {};
        this.households = storedHouseholds ? JSON.parse(storedHouseholds) : [];
        this.currentHouseholdId = storedCurrentHouseholdId || null;
        
        // Migration : si on a une ancienne shoppingList globale, la convertir en liste foyer
        if (!storedShoppingListsHousehold && localStorage.getItem('shoppingLists')) {
            const oldShoppingList = JSON.parse(localStorage.getItem('shoppingList'));
            if (oldShoppingList.length > 0) {
                // Créer une famille par défaut
                const defaultFamily = {
                    id: 'default-family',
                    name: 'Famille Principale',
                    color: '#b19cd9',
                    createdAt: new Date().toISOString()
                };
                this.families.push(defaultFamily);
                this.shoppingLists.push({
                    id: 'default-shopping-list',
                    familyId: 'default-family',
                    items: oldShoppingList,
                    createdAt: new Date().toISOString()
                });
                this.currentFamilyId = 'default-family';
                localStorage.removeItem('shoppingList'); // Nettoyer l'ancienne donnée
            }
        }
    }

    saveData() {
        localStorage.setItem('users', JSON.stringify(this.users));
        localStorage.setItem('appointments', JSON.stringify(this.appointments));
        localStorage.setItem('shoppingListsHousehold', JSON.stringify(this.shoppingListsHousehold));
        localStorage.setItem('shoppingListsPersonal', JSON.stringify(this.shoppingListsPersonal));
        localStorage.setItem('households', JSON.stringify(this.households));
        localStorage.setItem('currentHouseholdId', this.currentHouseholdId || '');
    }

    // Gestion des événements
    setupEventListeners() {
        // Paramètres
        document.getElementById('btnSettings').addEventListener('click', () => this.openSettings());

        // Navigation calendrier
        document.getElementById('btnPrevMonth').addEventListener('click', () => this.previousMonth());
        document.getElementById('btnNextMonth').addEventListener('click', () => this.nextMonth());

        // Utilisateurs
        document.getElementById('btnAddUser').addEventListener('click', () => this.openUserModal());
        document.getElementById('btnSaveUser').addEventListener('click', () => this.saveUser());
        document.getElementById('btnCancelUser').addEventListener('click', () => this.closeUserModal());

        // Foyers
        document.getElementById('btnAddHousehold').addEventListener('click', () => this.openHouseholdModal());
        document.getElementById('btnSaveHousehold').addEventListener('click', () => this.saveHousehold());
        document.getElementById('btnDeleteHousehold').addEventListener('click', () => this.deleteHousehold());
        document.getElementById('btnCancelHousehold').addEventListener('click', () => this.closeHouseholdModal());
        document.getElementById('householdSelect').addEventListener('change', (e) => this.selectHousehold(e.target.value));

        // Rendez-vous
        document.getElementById('btnSaveAppointment').addEventListener('click', () => this.saveAppointment());
        document.getElementById('btnDeleteAppointment').addEventListener('click', () => this.deleteAppointment());
        document.getElementById('btnCancelAppointment').addEventListener('click', () => this.closeAppointmentModal());

        // Modals
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('active');
            });
        });

        // Fermer les modals en cliquant à l'extérieur
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Liste de courses
        document.getElementById('btnShoppingList').addEventListener('click', () => this.openShoppingModal());
        document.getElementById('btnAddShoppingItem').addEventListener('click', () => this.addShoppingItem());
        document.getElementById('newShoppingItem').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addShoppingItem();
        });
        document.getElementById('btnClearCompleted').addEventListener('click', () => this.clearCompletedItems());
    }

    // Navigation calendrier
    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    }

    // Rendu du calendrier
    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // Mise à jour du titre
        const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                          'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        document.getElementById('monthYear').textContent = `${monthNames[month]} ${year}`;

        // Premier jour du mois et nombre de jours
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const calendarDays = document.getElementById('calendarDays');
        calendarDays.innerHTML = '';

        // Jours du mois précédent
        for (let i = firstDay - 1; i >= 0; i--) {
            const dayDiv = this.createDayElement(daysInPrevMonth - i, true, null);
            calendarDays.appendChild(dayDiv);
        }

        // Jours du mois actuel
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDiv = this.createDayElement(day, false, new Date(year, month, day));
            calendarDays.appendChild(dayDiv);
        }

        // Jours du mois suivant
        const remainingDays = 42 - (daysInMonth + firstDay - 1);
        for (let day = 1; day <= remainingDays; day++) {
            const dayDiv = this.createDayElement(day, true, null);
            calendarDays.appendChild(dayDiv);
        }
    }

    createDayElement(day, isOtherMonth, date) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'day';
        if (isOtherMonth) {
            dayDiv.classList.add('other-month');
        }

        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayDiv.appendChild(dayNumber);

        if (date) {
            const appointmentsContainer = document.createElement('div');
            appointmentsContainer.className = 'appointments-container';

            // Récupérer les rendez-vous pour ce jour
            const dateString = this.formatDate(date);
            const dayAppointments = this.appointments.filter(apt => apt.date === dateString);
            
            dayAppointments.forEach(apt => {
                const appointmentDiv = document.createElement('div');
                appointmentDiv.className = 'appointment';
                const user = this.users.find(u => u.id === apt.userId);
                const categoryIcon = this.getCategoryIcon(apt.category || 'personnel');
                const categoryColor = this.getCategoryColor(apt.category || 'personnel');
                
                appointmentDiv.style.borderLeftColor = categoryColor;
                appointmentDiv.style.borderColor = categoryColor;
                appointmentDiv.style.color = categoryColor;
                
                appointmentDiv.textContent = `${categoryIcon} ${apt.title}`;
                if (apt.time) {
                    const timeSpan = document.createElement('span');
                    timeSpan.className = 'appointment-time';
                    timeSpan.textContent = apt.time;
                    appointmentDiv.appendChild(timeSpan);
                }
                
                appointmentDiv.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openAppointmentModal(date, apt.id);
                });
                appointmentsContainer.appendChild(appointmentDiv);
            });

            dayDiv.appendChild(appointmentsContainer);

            // Clic sur le jour pour ajouter un rendez-vous
            dayDiv.addEventListener('click', () => {
                this.openAppointmentModal(date);
            });
        }

        return dayDiv;
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    parseDate(dateString) {
        return new Date(dateString);
    }

    // Gestion des utilisateurs
    getCategoryIcon(category) {
        const icons = {
            'personnel': '👤',
            'familial': '👨‍👩‍👧‍👦',
            'medical': '🏥',
            'professionnel': '💼',
            'loisirs': '🎭',
            'administratif': '📋',
            'shopping': '🛍️',
            'sport': '⚽',
            'autre': '❓'
        };
        return icons[category] || '❓';
    }

    getCategoryColor(category) {
        const colors = {
            'personnel': '#b19cd9',      // lila
            'familial': '#d4bfff',       // lila pâle
            'medical': '#ff6b6b',        // rouge médical
            'professionnel': '#4a90e2',  // bleu pro
            'loisirs': '#f5a623',        // orange loisirs
            'administratif': '#7ed321', // vert admin
            'shopping': '#bd10e0',       // violet shopping
            'sport': '#50e3c2',          // turquoise sport
            'autre': '#9b9b9b'           // gris autre
        };
        return colors[category] || '#9b9b9b';
    }

    getGenreLabel(genre) {
        const labels = {
            'non-renseigne': '❓',
            'femme': '👩',
            'homme': '👨',
            'chat': '🐱',
            'chien': '🐶',
            'lapin': '🐰',
            'oiseau': '🐦',
            'hamster': '🐹',
            'poisson': '🐠',
            'tortue': '🐢',
            'souris': '🐭',
            'cobaye': '🐹',
            'perroquet': '🦜',
            'cheval': '🐴'
        };
        return labels[genre] || '❓';
    }

    getRelationLabel(relation) {
        const labels = {
            'non-renseigne': '❓',
            'pere': '👨',
            'mere': '👩',
            'fils': '👦',
            'fille': '👧',
            'frere': '👨‍👦',
            'soeur': '👩‍👧',
            'grand-pere': '👴',
            'grand-mere': '👵',
            'oncle': '👨‍💼',
            'tante': '👩‍💼',
            'cousin': '👦',
            'cousine': '👧',
            'neveu': '👶',
            'niece': '👶',
            'conjoint': '💑',
            'compagnon': '💑',
            'animal-familier': '🐾',
            'autre': '❓'
        };
        return labels[relation] || '❓';
    }

    renderUsersList() {
        const usersList = document.getElementById('usersList');
        usersList.innerHTML = '';

        this.users.forEach(user => {
            const badge = document.createElement('div');
            badge.className = 'user-badge';
            const genreLabel = this.getGenreLabel(user.genre);
            const relationLabel = this.getRelationLabel(user.relation);
            badge.textContent = `${relationLabel} ${user.name}`;
            badge.style.backgroundColor = user.color;
            badge.style.color = this.getContrastColor(user.color);
            badge.title = `Relation: ${relationLabel} | Genre: ${genreLabel} | Couleur: ${user.color}`;
            usersList.appendChild(badge);
        });
    }

    populateUserSelect() {
        const select = document.getElementById('appointmentUser');
        select.innerHTML = '<option value="">-- Sélectionner un utilisateur --</option>';
        
        this.users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            const relationLabel = this.getRelationLabel(user.relation);
            option.textContent = `${relationLabel} ${user.name}`;
            select.appendChild(option);
        });
    }

    openUserModal() {
        document.getElementById('userName').value = '';
        document.getElementById('userGenre').value = 'non-renseigne';
        document.getElementById('userRelation').value = 'non-renseigne';
        document.getElementById('userColor').value = '#b19cd9';
        this.selectedColor = '#b19cd9';
        
        document.getElementById('userModal').classList.add('active');
        document.getElementById('userName').focus();
    }

    closeUserModal() {
        document.getElementById('userModal').classList.remove('active');
    }

    saveUser() {
        const name = document.getElementById('userName').value.trim();
        const genre = document.getElementById('userGenre').value;
        const relation = document.getElementById('userRelation').value;
        const color = document.getElementById('userColor').value;

        if (!name) {
            alert('Veuillez entrer un nom d\'utilisateur');
            return;
        }

        const newUser = {
            id: Date.now().toString(),
            name: name,
            genre: genre,
            relation: relation,
            color: color
        };

        this.users.push(newUser);
        this.saveData();
        this.renderUsersList();
        this.populateUserSelect();
        this.closeUserModal();
    }

    // Gestion des foyers
    openHouseholdModal(householdId = null) {
        document.getElementById('familyName').value = '';
        document.getElementById('familyColor').value = '#b19cd9';
        document.getElementById('btnDeleteFamily').style.display = 'none';

        if (familyId) {
            const family = this.families.find(f => f.id === familyId);
            if (family) {
                document.getElementById('modalFamilyTitle').textContent = 'Modifier une famille';
                document.getElementById('familyName').value = family.name;
                document.getElementById('familyColor').value = family.color;
                document.getElementById('btnDeleteFamily').style.display = 'inline-block';
            }
        } else {
            document.getElementById('modalFamilyTitle').textContent = 'Créer une famille';
        }

        this.currentFamilyId = familyId;
        document.getElementById('familyModal').classList.add('active');
        document.getElementById('familyName').focus();
    }

    closeHouseholdModal() {
        document.getElementById('familyModal').classList.remove('active');
        this.currentFamilyId = null;
    }

    saveHousehold() {
        const name = document.getElementById('familyName').value.trim();
        const color = document.getElementById('familyColor').value;

        if (!name) {
            alert('Veuillez entrer un nom pour la famille');
            return;
        }

        if (this.currentFamilyId) {
            // Modification
            const family = this.families.find(f => f.id === this.currentFamilyId);
            if (family) {
                family.name = name;
                family.color = color;
            }
        } else {
            // Création
            const newFamily = {
                id: Date.now().toString(),
                name: name,
                color: color,
                createdAt: new Date().toISOString()
            };
            this.families.push(newFamily);
            
            // Créer une liste de courses vide pour cette famille
            const newShoppingList = {
                id: Date.now().toString() + '-shopping',
                familyId: newFamily.id,
                items: [],
                createdAt: new Date().toISOString()
            };
            this.shoppingLists.push(newShoppingList);
        }

        this.saveData();
        this.renderFamiliesList();
        this.populateFamilySelect();
        this.closeFamilyModal();
    }

    deleteHousehold() {
        if (!this.currentFamilyId) return;
        
        if (confirm('Êtes-vous sûr de vouloir supprimer cette famille ? Toutes les listes de courses associées seront supprimées.')) {
            // Supprimer la famille
            this.families = this.families.filter(f => f.id !== this.currentFamilyId);
            
            // Supprimer les listes de courses associées
            this.shoppingLists = this.shoppingLists.filter(sl => sl.familyId !== this.currentFamilyId);
            
            // Si c'était la famille actuelle, en sélectionner une autre
            if (this.currentFamilyId === this.currentFamilyId) {
                this.currentFamilyId = this.families.length > 0 ? this.families[0].id : null;
            }
            
            this.saveData();
            this.renderFamiliesList();
            this.populateFamilySelect();
            this.renderShoppingList();
            this.closeFamilyModal();
        }
    }

    selectHousehold(householdId) {
        this.currentFamilyId = familyId;
        this.saveData();
        this.renderShoppingList();
    }

    renderHouseholdsList() {
        const familiesList = document.getElementById('familiesList');
        familiesList.innerHTML = '';

        this.families.forEach(family => {
            const familyDiv = document.createElement('div');
            familyDiv.className = 'family-item';
            familyDiv.style.borderLeftColor = family.color;
            familyDiv.innerHTML = `
                <div class="family-info">
                    <span class="family-name">${family.name}</span>
                    <span class="family-members">${this.getFamilyMembersCount(family.id)} membre(s)</span>
                </div>
                <button class="btn-edit-family" onclick="app.openFamilyModal('${family.id}')" title="Modifier">✏️</button>
            `;
            familyDiv.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn-edit-family')) {
                    this.selectFamily(family.id);
                }
            });
            familiesList.appendChild(familyDiv);
        });
    }

    populateHouseholdSelect() {
        const select = document.getElementById('familySelect');
        select.innerHTML = '<option value="">-- Sélectionner une famille --</option>';
        
        this.families.forEach(family => {
            const option = document.createElement('option');
            option.value = family.id;
            option.textContent = family.name;
            if (family.id === this.currentFamilyId) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }

    updateHouseholdSelector() {
        const selector = document.getElementById('currentFamilyDisplay');
        const currentFamily = this.families.find(f => f.id === this.currentFamilyId);
        if (currentFamily) {
            selector.textContent = `Famille: ${currentFamily.name}`;
            selector.style.color = currentFamily.color;
        } else {
            selector.textContent = 'Aucune famille sélectionnée';
            selector.style.color = 'var(--text-light)';
        }
    }

    getHouseholdMembersCount(householdId) {
        // Pour l'instant, on compte tous les utilisateurs comme membres de toutes les familles
        // Plus tard, on pourra assigner des utilisateurs spécifiques à des familles
        return this.users.length;
    }

    // Gestion des rendez-vous
    openAppointmentModal(date, appointmentId = null) {
        const dateString = this.formatDate(date);
        document.getElementById('appointmentDay').textContent = date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        this.currentAppointmentDate = dateString;
        this.currentAppointmentId = appointmentId;

        document.getElementById('appointmentTitle').value = '';
        document.getElementById('appointmentTime').value = '';
        document.getElementById('appointmentDescription').value = '';
        document.getElementById('appointmentUser').value = '';
        document.getElementById('appointmentCategory').value = 'personnel';
        document.getElementById('btnDeleteAppointment').style.display = 'none';

        if (appointmentId) {
            // Mode édition
            const apt = this.appointments.find(a => a.id === appointmentId);
            if (apt) {
                document.getElementById('modalTitle').textContent = 'Modifier un rendez-vous';
                document.getElementById('appointmentUser').value = apt.userId;
                document.getElementById('appointmentCategory').value = apt.category || 'personnel';
                document.getElementById('appointmentTitle').value = apt.title;
                document.getElementById('appointmentTime').value = apt.time || '';
                document.getElementById('appointmentDescription').value = apt.description || '';
                document.getElementById('btnDeleteAppointment').style.display = 'inline-block';
            }
        } else {
            document.getElementById('modalTitle').textContent = 'Ajouter un rendez-vous';
        }

        document.getElementById('appointmentModal').classList.add('active');
        document.getElementById('appointmentTitle').focus();
    }

    closeAppointmentModal() {
        document.getElementById('appointmentModal').classList.remove('active');
        this.currentAppointmentDate = null;
        this.currentAppointmentId = null;
    }

    saveAppointment() {
        const userId = document.getElementById('appointmentUser').value;
        const category = document.getElementById('appointmentCategory').value;
        const title = document.getElementById('appointmentTitle').value.trim();
        const time = document.getElementById('appointmentTime').value;
        const description = document.getElementById('appointmentDescription').value.trim();

        if (!userId) {
            alert('Veuillez sélectionner un utilisateur');
            return;
        }

        if (!title) {
            alert('Veuillez entrer un titre pour le rendez-vous');
            return;
        }

        if (this.currentAppointmentId) {
            // Modification
            const apt = this.appointments.find(a => a.id === this.currentAppointmentId);
            if (apt) {
                apt.userId = userId;
                apt.category = category;
                apt.title = title;
                apt.time = time;
                apt.description = description;
            }
        } else {
            // Création
            const newAppointment = {
                id: Date.now().toString(),
                date: this.currentAppointmentDate,
                userId: userId,
                category: category,
                title: title,
                time: time,
                description: description
            };
            this.appointments.push(newAppointment);
        }

        this.saveData();
        this.renderCalendar();
        this.closeAppointmentModal();
    }

    deleteAppointment() {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
            this.appointments = this.appointments.filter(a => a.id !== this.currentAppointmentId);
            this.saveData();
            this.renderCalendar();
            this.closeAppointmentModal();
        }
    }

    // Utilitaires
    getContrastColor(hexColor) {
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? '#000000' : '#ffffff';
    }

    openSettings() {
        this.renderFamiliesList();
        this.populateFamilySelect();
        this.updateSettingsStats();
        document.getElementById('settingsModal').classList.add('active');
    }

    updateSettingsStats() {
        document.getElementById('statsUsers').textContent = this.users.length;
        document.getElementById('statsFamilies').textContent = this.families.length;
        document.getElementById('statsAppointments').textContent = this.appointments.length;
        
        let totalShoppingItems = 0;
        this.shoppingLists.forEach(list => {
            totalShoppingItems += list.items.length;
        });
        document.getElementById('statsShoppingItems').textContent = totalShoppingItems;
    }

    // Gestion de la liste de courses
    openShoppingModal() {
        this.renderShoppingList();
        document.getElementById('shoppingModal').classList.add('active');
        this.updateShoppingModeInfo();
        document.getElementById('newShoppingItem').focus();
    }

    updateShoppingModeInfo() {
        const mode = document.getElementById('shoppingMode').value;
        const infoDiv = document.getElementById('shoppingModeInfo');
        
        if (mode === 'household' && this.currentHouseholdId) {
            const household = this.households.find(h => h.id === this.currentHouseholdId);
            infoDiv.textContent = `📝 Ajout à la liste du foyer : ${household ? household.name : 'Inconnu'}`;
            infoDiv.style.color = household ? household.color : 'var(--text-light)';
        } else if (mode === 'household') {
            infoDiv.textContent = '📝 Aucun foyer sélectionné - Les articles personnels seront ajoutés à la liste personnelle';
            infoDiv.style.color = 'var(--text-light)';
        } else {
            infoDiv.textContent = '👤 Ajout à votre liste personnelle';
            infoDiv.style.color = 'var(--primary-color)';
        }
    }

    getCurrentShoppingList() {
        const mode = document.getElementById('shoppingMode').value;
        
        if (mode === 'personal') {
            if (!this.shoppingListsPersonal['personal']) {
                this.shoppingListsPersonal['personal'] = [];
            }
            return { items: this.shoppingListsPersonal['personal'], mode: 'personal' };
        } else if (this.currentHouseholdId) {
            let list = this.shoppingListsHousehold.find(sl => sl.householdId === this.currentHouseholdId);
            if (!list) {
                list = {
                    id: Date.now().toString() + '-household',
                    householdId: this.currentHouseholdId,
                    items: [],
                    createdAt: new Date().toISOString()
                };
                this.shoppingListsHousehold.push(list);
            }
            return { items: list.items, mode: 'household', list: list };
        }
        return { items: [], mode: 'personal' };
    }

    addShoppingItem() {
        const input = document.getElementById('newShoppingItem');
        const itemText = input.value.trim();

        if (!itemText) {
            alert('Veuillez entrer un article à ajouter');
            return;
        }

        const shoppingListData = this.getCurrentShoppingList();
        
        if (shoppingListData.mode === 'personal') {
            if (!this.shoppingListsPersonal['personal']) {
                this.shoppingListsPersonal['personal'] = [];
            }
            shoppingListData.items = this.shoppingListsPersonal['personal'];
        } else if (shoppingListData.mode === 'household' && !this.currentHouseholdId) {
            // Si on est en mode foyer mais pas de foyer sélectionné, ajouter aux articles perso
            if (!this.shoppingListsPersonal['personal']) {
                this.shoppingListsPersonal['personal'] = [];
            }
            shoppingListData.items = this.shoppingListsPersonal['personal'];
        }

        const newItem = {
            id: Date.now().toString(),
            text: itemText,
            completed: false,
            createdAt: new Date().toISOString()
        };

        shoppingListData.items.push(newItem);
        this.saveData();
        this.renderShoppingList();
        input.value = '';
        input.focus();
    }

    toggleShoppingItem(itemId, source = 'personal') {
        if (source === 'household' && this.currentHouseholdId) {
            const householdList = this.shoppingListsHousehold.find(sl => sl.householdId === this.currentHouseholdId);
            if (householdList) {
                const item = householdList.items.find(i => i.id === itemId);
                if (item) {
                    item.completed = !item.completed;
                    this.saveData();
                    this.renderShoppingList();
                }
            }
        } else {
            if (!this.shoppingListsPersonal['personal']) {
                this.shoppingListsPersonal['personal'] = [];
            }
            const item = this.shoppingListsPersonal['personal'].find(i => i.id === itemId);
            if (item) {
                item.completed = !item.completed;
                this.saveData();
                this.renderShoppingList();
            }
        }
    }

    deleteShoppingItem(itemId, source = 'personal') {
        if (source === 'household' && this.currentHouseholdId) {
            const householdList = this.shoppingListsHousehold.find(sl => sl.householdId === this.currentHouseholdId);
            if (householdList) {
                householdList.items = householdList.items.filter(item => item.id !== itemId);
                this.saveData();
                this.renderShoppingList();
            }
        } else {
            if (!this.shoppingListsPersonal['personal']) {
                this.shoppingListsPersonal['personal'] = [];
            }
            this.shoppingListsPersonal['personal'] = this.shoppingListsPersonal['personal'].filter(item => item.id !== itemId);
            this.saveData();
            this.renderShoppingList();
        }
    }

    clearCompletedItems() {
        if (confirm('Êtes-vous sûr de vouloir supprimer tous les articles cochés des deux listes ?')) {
            // Vider les articles cochés du foyer
            if (this.currentHouseholdId) {
                const householdList = this.shoppingListsHousehold.find(sl => sl.householdId === this.currentHouseholdId);
                if (householdList) {
                    householdList.items = householdList.items.filter(item => !item.completed);
                }
            }

            // Vider les articles cochés perso
            if (this.shoppingListsPersonal['personal']) {
                this.shoppingListsPersonal['personal'] = this.shoppingListsPersonal['personal'].filter(item => !item.completed);
            }

            this.saveData();
            this.renderShoppingList();
        }
    }

    renderShoppingList() {
        const shoppingListElement = document.getElementById('shoppingList');
        shoppingListElement.innerHTML = '';

        // Récupérer les articles du foyer et perso
        let householdItems = [];
        let personalItems = [];

        if (this.currentHouseholdId) {
            const householdList = this.shoppingListsHousehold.find(sl => sl.householdId === this.currentHouseholdId);
            if (householdList) {
                householdItems = householdList.items.map(item => ({...item, source: 'household'}));
            }
        }

        if (this.shoppingListsPersonal['personal']) {
            personalItems = this.shoppingListsPersonal['personal'].map(item => ({...item, source: 'personal'}));
        }

        const allItems = [...householdItems, ...personalItems];

        if (allItems.length === 0) {
            shoppingListElement.innerHTML = '<div style="text-align: center; color: var(--text-light); padding: 40px; font-style: italic;">Aucun article dans les listes</div>';
        } else {
            allItems.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = `shopping-item ${item.completed ? 'completed' : ''}`;
                const badge = item.source === 'household' ? '🏠' : '👤';

                itemDiv.innerHTML = `
                    <input type="checkbox" class="shopping-checkbox" ${item.completed ? 'checked' : ''} 
                           onchange="app.toggleShoppingItem('${item.id}', '${item.source}')">
                    <span class="item-text">${badge} ${item.text}</span>
                    <button class="btn-delete-item" onclick="app.deleteShoppingItem('${item.id}', '${item.source}')" title="Supprimer">×</button>
                `;

                shoppingListElement.appendChild(itemDiv);
            });
        }

        this.updateShoppingStats();
    }

    updateShoppingStats() {
        let totalItems = 0;
        let completedItems = 0;

        // Compter les articles du foyer
        if (this.currentHouseholdId) {
            const householdList = this.shoppingListsHousehold.find(sl => sl.householdId === this.currentHouseholdId);
            if (householdList) {
                totalItems += householdList.items.length;
                completedItems += householdList.items.filter(item => item.completed).length;
            }
        }

        // Compter les articles perso
        if (this.shoppingListsPersonal['personal']) {
            totalItems += this.shoppingListsPersonal['personal'].length;
            completedItems += this.shoppingListsPersonal['personal'].filter(item => item.completed).length;
        }

        const statsElement = document.getElementById('shoppingStats');
        statsElement.textContent = `${totalItems} article(s) - ${completedItems} coché(s)`;
    }
}

// Initialiser l'application au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PlanningApp();
});
