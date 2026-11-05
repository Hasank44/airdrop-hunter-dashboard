import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/UI';
import { useToast } from '../components/Toast';
import { Lock, ShieldCheck } from 'lucide-react';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [totp, setTotp] = useState('');
    const [needTotp, setNeedTotp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function submit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(email, password, needTotp ? totp : undefined);
            navigate('/', { replace: true });
        } catch (err) {
            if (err.code === 'TOTP_REQUIRED' || /2fa|totp/i.test(err.message || '')) {
                setNeedTotp(true);
                setError('Enter your 2FA code from the authenticator app.');
            } else {
                setError(err.message || 'Login failed');
                toast.error(err.message || 'Login failed');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-3">
            <div className="w-full max-w-sm">
                <div className="mb-6 flex flex-col items-center text-center">
                    <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-emerald-500 text-black">
                        <ShieldCheck size={24} />
                    </div>
                    <h1 className="text-xl font-semibold text-white">Airdrop Hunter</h1>
                    <p className="text-sm text-gray-400">Owner sign-in</p>
                </div>
                <form onSubmit={submit} className="card p-5 space-y-3">
                    <Input
                        label="Email"
                        type="email"
                        autoComplete="username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                    />
                    <Input
                        label="Password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                    {needTotp && (
                        <Input
                            label="2FA Code"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]{6}"
                            maxLength={6}
                            value={totp}
                            onChange={(e) => setTotp(e.target.value.replace(/\D/g, ''))}
                            placeholder="123456"
                        />
                    )}
                    {error && <p className="text-xs text-red-400">{error}</p>}
                    <Button type="submit" loading={loading} className="w-full">
                        <Lock size={14} /> Sign in
                    </Button>
                </form>

                <p className="mt-3 text-center text-xs text-gray-600">
                    Private · Owner-only access
                </p>
            </div>
        </div>
    );
}