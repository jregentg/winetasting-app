// HOTFIX TEMPORAIRE - à injecter via la console
// Pour corriger l'erreur de création de participant

console.log('🔧 HOTFIX: Injection de la correction pour création participant...');

// Redéfinir la fonction createSessionParticipant avec gestion d'erreur
if (typeof window.createSessionParticipantOriginal === 'undefined') {
    // Sauvegarder la fonction originale
    window.createSessionParticipantOriginal = window.createSessionParticipant;
    
    // Nouvelle fonction corrigée
    window.createSessionParticipant = async function() {
        console.log('🔧 createSessionParticipant() HOTFIX appelée pour session:', currentSessionId);
        
        if (!api.isArbitre()) {
            showError('Seuls les arbitres peuvent créer des participants');
            return;
        }
        
        if (!currentSessionId) {
            showError('Aucune session sélectionnée');
            return;
        }
        
        const firstNameEl = document.getElementById('create-participant-firstname');
        const emailEl = document.getElementById('create-participant-email');
        
        if (!firstNameEl || !emailEl) {
            showError('Formulaire de création introuvable');
            return;
        }
        
        const firstName = firstNameEl.value.trim();
        const email = emailEl.value.trim();
        
        if (!firstName || !email) {
            showError('Veuillez remplir tous les champs');
            return;
        }
        
        try {
            setLoading(true);
            
            console.log('📡 Appel API createUser...');
            const response = await api.createUser({ firstName, email });
            console.log('📡 Réponse API HOTFIX:', response);
            
            if (response && response.success) {
                setLoading(false);
                
                const successMsg = response.emailSent 
                    ? 'Participant créé avec succès • Email d\'invitation envoyé'
                    : 'Participant créé avec succès • Email simulé (mode développement)';
                
                showSuccess(successMsg);
                
                // Vider les champs
                firstNameEl.value = '';
                emailEl.value = '';
                
                console.log('📧 Lien d\'activation:', response.activationLink);
                
                // CORRECTION: Gestion robuste de l'ID
                let newUserId;
                console.log('🔍 Structure de réponse HOTFIX:', JSON.stringify(response, null, 2));
                
                if (response.user && response.user.id) {
                    newUserId = response.user.id;
                    console.log('✅ ID participant récupéré (user):', newUserId);
                } else if (response.data && response.data.id) {
                    newUserId = response.data.id;
                    console.log('✅ ID participant récupéré (data):', newUserId);
                } else if (response.id) {
                    newUserId = response.id;
                    console.log('✅ ID participant récupéré (direct):', newUserId);
                } else {
                    console.error('❌ HOTFIX: Impossible de trouver l\'ID du participant');
                    showError('Participant créé mais impossible de récupérer son ID');
                    return;
                }
                
                // Continuer avec l'ajout à la session si ID trouvé
                if (newUserId) {
                    console.log('🔧 Ajout du participant à la session...');
                    setTimeout(() => {
                        try {
                            backToSessionManagement();
                            setTimeout(() => {
                                console.log('🔄 Rechargement de la session:', currentSessionId);
                                if (typeof manageTastingSession === 'function') {
                                    manageTastingSession(currentSessionId).then(() => {
                                        setTimeout(() => {
                                            console.log('🔄 Basculement vers onglet participants');
                                            if (typeof showSessionTab === 'function') {
                                                showSessionTab('participants');
                                            }
                                        }, 200);
                                    }).catch(reloadError => {
                                        console.error('❌ Erreur rechargement session:', reloadError);
                                    });
                                }
                            }, 300);
                        } catch (error) {
                            console.error('❌ Erreur navigation HOTFIX:', error);
                        }
                    }, 1000);
                }
                
            } else {
                setLoading(false);
                showError('Erreur lors de la création: ' + (response?.message || 'Erreur inconnue'));
            }
            
        } catch (error) {
            console.error('❌ Erreur création participant HOTFIX:', error);
            showError('Erreur lors de la création: ' + error.message);
            setLoading(false);
        }
    };
    
    console.log('✅ HOTFIX: Fonction createSessionParticipant corrigée et injectée');
    console.log('🎯 Vous pouvez maintenant créer des participants sans erreur');
}