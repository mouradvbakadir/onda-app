/**
 * Amnt — Login Page (Premium Light Theme)
 */
import { auth } from '../services/auth.js';

export function renderLogin(container) {
    container.innerHTML = `
        <div style="display: flex; height: 100vh; width: 100vw; background: linear-gradient(135deg, #f1f5f9 0%, #eef2ff 50%, #e0e7ff 100%); align-items: center; justify-content: center; position: relative; overflow: hidden;">
            
            <!-- Subtle decorative circles -->
            <div style="position: absolute; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%); top: -150px; right: -100px;"></div>
            <div style="position: absolute; width: 350px; height: 350px; border-radius: 50%; background: radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%); bottom: -80px; left: -80px;"></div>

            <div class="card" style="width: 100%; max-width: 400px; position: relative; z-index: 1; padding: 2.5rem; background: white; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.06), 0 8px 10px -6px rgb(0 0 0 / 0.04);">
                <div class="text-center mb-6">
                    <div style="background: #f8fafc; padding: 0.75rem; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1.25rem; border: 1px solid #e2e8f0;">
                        <img src="/logo.png" alt="ONDA Logo" style="height: 52px; width: auto; object-fit: contain;">
                    </div>
                    <h1 style="font-size: 1.75rem; color: #0f172a; margin-bottom: 0.25rem;">Amnt</h1>
                    <p style="color: #64748b; font-size: 0.875rem; margin: 0;">Gestion de la Maintenance ONDA</p>
                </div>

                <div id="loginError" class="badge badge-danger w-full mb-4 hidden" style="justify-content: center; padding: 0.5rem; border-radius: 6px;"></div>

                <form id="loginForm">
                    <div class="form-group">
                        <label class="form-label">Email Professionnel</label>
                        <input type="email" id="email" class="form-control" required placeholder="nom@onda.ma" value="admin@onda.ma" style="padding: 0.5rem 0.75rem;">
                    </div>
                    
                    <div class="form-group mb-6">
                        <label class="form-label">Mot de passe</label>
                        <input type="password" id="password" class="form-control" required value="admin" style="padding: 0.5rem 0.75rem;">
                    </div>
                    
                    <button type="submit" class="btn btn-primary w-full" style="padding: 0.625rem; font-size: 0.875rem;">
                        Se connecter
                    </button>
                </form>

                <div class="mt-6 pt-4 text-center" style="border-top: 1px solid #f1f5f9;">
                    <p style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 0.5rem;">Comptes de démonstration :</p>
                    <div class="flex gap-2 justify-center flex-wrap">
                        <button class="btn btn-secondary demo-btn" data-email="admin@onda.ma" data-pwd="admin" style="font-size: 0.6875rem; padding: 0.25rem 0.625rem;">Super-Admin</button>
                        <button class="btn btn-secondary demo-btn" data-email="sup.cmn@onda.ma" data-pwd="sup" style="font-size: 0.6875rem; padding: 0.25rem 0.625rem;">Superviseur</button>
                        <button class="btn btn-secondary demo-btn" data-email="tech.cmn@onda.ma" data-pwd="tech" style="font-size: 0.6875rem; padding: 0.25rem 0.625rem;">Technicien</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.querySelectorAll('.demo-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('email').value = btn.getAttribute('data-email');
            document.getElementById('password').value = btn.getAttribute('data-pwd');
        });
    });

    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const pwd = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');

        const result = auth.login(email, pwd);
        
        if (result.success) {
            errorDiv.classList.add('hidden');
            if (result.user.role === 'TECHNICIEN') {
                window.location.hash = '#/preventif';
            } else {
                window.location.hash = '#/dashboard';
            }
        } else {
            errorDiv.textContent = result.message;
            errorDiv.classList.remove('hidden');
            const card = document.querySelector('.card');
            card.style.transform = 'translateX(5px)';
            setTimeout(() => card.style.transform = 'translateX(-5px)', 50);
            setTimeout(() => card.style.transform = 'translateX(5px)', 100);
            setTimeout(() => card.style.transform = 'translateX(0)', 150);
        }
    });
}
