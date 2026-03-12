import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Car, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError]     = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    setError('');
    try {
      await login(data.email, data.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Identifiants invalides');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl shadow-lg mb-4">
            <Car className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Bienvenue sur Carlog</h1>
          <p className="text-gray-500 text-sm mt-1">Connectez-vous pour accéder à vos véhicules</p>
        </div>

        <div className="card shadow-md">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse email</label>
              <input
                type="email"
                className="input-base"
                placeholder="vous@exemple.fr"
                {...register('email', { required: 'Email requis' })}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="input-base pr-10"
                  placeholder="••••••••"
                  {...register('password', { required: 'Mot de passe requis' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" className="btn-primary w-full justify-center" disabled={isSubmitting}>
              <LogIn className="w-4 h-4" />
              {isSubmitting ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-primary-600 font-medium hover:underline">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
