import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Car, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError]     = useState('');

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const pwd = watch('password');

  const onSubmit = async (data) => {
    setError('');
    try {
      await registerUser({ email: data.email, password: data.password, first_name: data.first_name, last_name: data.last_name });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'inscription');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl shadow-lg mb-4">
            <Car className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Créer un compte</h1>
          <p className="text-gray-500 text-sm mt-1">Commencez à suivre vos véhicules gratuitement</p>
        </div>

        <div className="card shadow-md">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Prénom</label>
                <input
                  className="input-base"
                  placeholder="Jean"
                  {...register('first_name', { required: 'Requis' })}
                />
                {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom</label>
                <input
                  className="input-base"
                  placeholder="Dupont"
                  {...register('last_name', { required: 'Requis' })}
                />
                {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse email</label>
              <input
                type="email"
                className="input-base"
                placeholder="vous@exemple.fr"
                {...register('email', {
                  required: 'Email requis',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email invalide' }
                })}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="input-base pr-10"
                  placeholder="8 caractères minimum"
                  {...register('password', { required: 'Requis', minLength: { value: 8, message: '8 caractères minimum' } })}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmer le mot de passe</label>
              <input
                type="password"
                className="input-base"
                placeholder="••••••••"
                {...register('confirm', {
                  required: 'Requis',
                  validate: v => v === pwd || 'Les mots de passe ne correspondent pas'
                })}
              />
              {errors.confirm && <p className="text-xs text-red-500 mt-1">{errors.confirm.message}</p>}
            </div>

            <button type="submit" className="btn-primary w-full justify-center" disabled={isSubmitting}>
              <UserPlus className="w-4 h-4" />
              {isSubmitting ? 'Création…' : 'Créer mon compte'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
