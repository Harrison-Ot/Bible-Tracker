import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';

export default function AuthLayout({
    title = '',
    description = '',
    variant = 'default',
    children,
}: {
    title?: string;
    description?: string;
    variant?: 'login' | 'register' | 'default';
    children: React.ReactNode;
}) {
    const authVariant = variant === 'default'
        ? title.toLowerCase().includes('register') || title.toLowerCase().includes('create')
            ? 'register'
            : 'login'
        : variant;

    return (
        <AuthLayoutTemplate title={title} description={description} variant={authVariant}>
            {children}
        </AuthLayoutTemplate>
    );
}
