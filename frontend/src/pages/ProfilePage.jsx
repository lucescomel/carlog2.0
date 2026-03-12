import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { User, Lock, Save, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import PageHeader from '../components/ui/PageHeader';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [pwdSuccess, setPwdSuccess]         = useState(false);
  const [pwdError, setPwdError]             = useState('');

  const { register: regProfile, handleSubmit: submitProfile, formState: { errors: pErrors } } = useForm({
    defaultValues: { first_name: user?.first_name, last_name: user?.last_name },
  });
  const { register: regPwd, handleSubmit: submitPwd, reset: resetPwd, formState: { errors: pwdErrors } } = useForm();

  const profileMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (res) => {
      updateUser(res.data);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    },
  });

  const pwdMutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      setPwdSuccess(true);
      setPwdError('');
      resetPwd();
      setTimeout(() => setPwdSuccess(false), 3000);
    },
    onError: (err) => setPwdError(err.response?.data?.error || 'Erreur'),
  });

  return (
    <div className="max-w-xl space-y-6 pb-20 md:pb-0">
      <PageHeader title="Mon profil" />

      {/* Infos personnelles */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <User className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Informations personnelles</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={submitProfile(profileMutation.mutate)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Prénom</label>
              <input className="input-base" {...regProfile('first_name', { required: true })} />
              {pErrors.first_name && <p className="text-xs text-red-500 mt-1">Requis</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom</label>
              <input className="input-base" {...regProfile('last_name', { required: true })} />
              {pErrors.last_name && <p className="text-xs text-red-500 mt-1">Requis</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" className="btn-primary" disabled={profileMutation.isPending}>
              <Save className="w-4 h-4" />
              {profileMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            {profileSuccess && (
              <span className="flex items-center gap-1.5 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" /> Mis à jour
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Mot de passe */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <Lock className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Changer le mot de passe</h2>
            <p className="text-sm text-gray-500">Minimum 8 caractères</p>
          </div>
        </div>

        <form onSubmit={submitPwd(pwdMutation.mutate)} className="space-y-4">
          {pwdError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {pwdError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe actuel</label>
            <input type="password" className="input-base" {...regPwd('current_password', { required: true })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nouveau mot de passe</label>
            <input type="password" className="input-base"
              {...regPwd('new_password', { required: true, minLength: { value: 8, message: '8 caractères minimum' } })} />
            {pwdErrors.new_password && <p className="text-xs text-red-500 mt-1">{pwdErrors.new_password.message}</p>}
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" className="btn-primary" disabled={pwdMutation.isPending}>
              <Lock className="w-4 h-4" />
              {pwdMutation.isPending ? 'Modification…' : 'Modifier'}
            </button>
            {pwdSuccess && (
              <span className="flex items-center gap-1.5 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" /> Modifié — reconnectez-vous
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Compte */}
      <div className="card border border-gray-100">
        <h2 className="font-semibold text-gray-900 mb-1">Compte créé le</h2>
        <p className="text-sm text-gray-500">{user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR', { dateStyle: 'long' }) : '—'}</p>
      </div>
    </div>
  );
}
