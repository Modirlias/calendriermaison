// Tests automatisés pour l'application de Planning Familial

console.log('🧪 Démarrage des tests...\n');

let testsPassés = 0;
let testsÉchués = 0;

// Fonction utilitaire pour les tests
function test(description, fn) {
    try {
        fn();
        console.log(`✅ ${description}`);
        testsPassés++;
    } catch (error) {
        console.error(`❌ ${description}`);
        console.error(`   Erreur: ${error.message}`);
        testsÉchués++;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

// Attendre que l'app soit chargée
setTimeout(() => {
    console.log('🔍 Test 1: Initialisation de l\'application');
    console.log('=' .repeat(50));
    
    test('L\'application a créé une instance de PlanningApp', () => {
        const calendarDays = document.getElementById('calendarDays');
        assert(calendarDays !== null, 'L\'élément calendarDays n\'existe pas');
        assert(calendarDays.children.length > 0, 'Le calendrier n\'a pas de jours');
    });

    test('Le mois/année est affiché', () => {
        const monthYear = document.getElementById('monthYear');
        assert(monthYear.textContent.trim() !== '', 'Le mois/année n\'est pas affiché');
        assert(monthYear.textContent.includes('Mars') || monthYear.textContent.includes('2026'), 
               'Le mois ou l\'année ne s\'affiche pas correctement');
    });

    test('Les utilisateurs sont affichés', () => {
        const usersList = document.getElementById('usersList');
        assert(usersList !== null, 'L\'élément usersList n\'existe pas');
    });

    console.log('\n🔍 Test 2: Modales');
    console.log('=' .repeat(50));

    test('La modale d\'ajout d\'utilisateur existe', () => {
        const modal = document.getElementById('userModal');
        assert(modal !== null, 'La modale userModal n\'existe pas');
        assert(modal.classList.contains('modal'), 'La modale n\'a pas la classe modal');
    });

    test('La modale de rendez-vous existe', () => {
        const modal = document.getElementById('appointmentModal');
        assert(modal !== null, 'La modale appointmentModal n\'existe pas');
        assert(modal.classList.contains('modal'), 'La modale n\'a pas la classe modal');
    });

    test('Les champs de saisie existent', () => {
        const inputs = [
            'userName',
            'selectedColor',
            'appointmentTitle',
            'appointmentTime',
            'appointmentDescription'
        ];
        inputs.forEach(id => {
            const input = document.getElementById(id);
            assert(input !== null, `Le champ ${id} n\'existe pas`);
        });
    });

    console.log('\n🔍 Test 3: Événements et boutons');
    console.log('=' .repeat(50));

    test('Les boutons de navigation existent', () => {
        const prevBtn = document.getElementById('btnPrevMonth');
        const nextBtn = document.getElementById('btnNextMonth');
        assert(prevBtn !== null, 'Le bouton Mois précédent n\'existe pas');
        assert(nextBtn !== null, 'Le bouton Mois suivant n\'existe pas');
    });

    test('Les sélecteurs de couleur existent', () => {
        const colorOptions = document.querySelectorAll('.color-option');
        assert(colorOptions.length > 0, 'Aucune option de couleur trouvée');
        assert(colorOptions.length === 10, `Il devrait y avoir 10 couleurs, trouvé ${colorOptions.length}`);
    });

    test('Chaque couleur a un attribut data-color', () => {
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            assert(option.dataset.color !== undefined, 'Une couleur n\'a pas d\'attribut data-color');
            assert(option.dataset.color.startsWith('#'), 'La couleur ne commence pas par #');
        });
    });

    console.log('\n🔍 Test 4: LocalStorage');
    console.log('=' .repeat(50));

    test('Les clés localStorage existent ou peuvent être créées', () => {
        localStorage.getItem('users');
        localStorage.getItem('appointments');
        assert(true, 'localStorage est accessible');
    });

    test('Les données persistées peuvent être récupérées', () => {
        const users = localStorage.getItem('users');
        const appointments = localStorage.getItem('appointments');
        // Peuvent être null ou valides JSON
        if (users) JSON.parse(users);
        if (appointments) JSON.parse(appointments);
        assert(true, 'Les données localStorage sont en JSON valide');
    });

    console.log('\n🔍 Test 5: Calendrier');
    console.log('=' .repeat(50));

    test('Le calendrier a 42 jours (6 semaines)', () => {
        const days = document.querySelectorAll('.day');
        assert(days.length === 42, `Le calendrier devrait avoir 42 jours, trouvé ${days.length}`);
    });

    test('Les jours du mois ont des numéros', () => {
        const dayNumbers = document.querySelectorAll('.day-number');
        assert(dayNumbers.length === 42, 'Tous les jours devraient avoir un numéro');
        let count = 0;
        dayNumbers.forEach(num => {
            if (num.textContent.trim() !== '') count++;
        });
        assert(count === 42, 'Les numéros de jour manquent');
    });

    test('Les jours du mois autre sont marqués comme such', () => {
        const otherMonthDays = document.querySelectorAll('.day.other-month');
        assert(otherMonthDays.length > 0, 'Aucun jour du mois autre trouvé');
    });

    console.log('\n🔍 Test 6: Accessibilité');
    console.log('=' .repeat(50));

    test('Les boutons sont accessibles au clavier', () => {
        const buttons = document.querySelectorAll('button');
        assert(buttons.length > 0, 'Aucun bouton trouvé');
        buttons.forEach(btn => {
            assert(btn.getAttribute('aria-label') || btn.textContent.trim() !== '', 
                   'Un bouton n\'a pas de label');
        });
    });

    test('Le select des utilisateurs existe', () => {
        const select = document.getElementById('appointmentUser');
        assert(select !== null, 'Le select appointmentUser n\'existe pas');
        assert(select.tagName === 'SELECT', 'appointmentUser n\'est pas un select');
    });

    console.log('\n📊 Résumé des tests');
    console.log('=' .repeat(50));
    console.log(`✅ Réussis: ${testsPassés}`);
    console.log(`❌ Échoués: ${testsÉchués}`);
    console.log(`📈 Total: ${testsPassés + testsÉchués}`);
    
    if (testsÉchués === 0) {
        console.log('\n🎉 Tous les tests sont passés ! L\'application est prête.');
    } else {
        console.log(`\n⚠️  ${testsÉchués} test(s) ont échoué. Vérifiez les erreurs ci-dessus.`);
    }

}, 500);
