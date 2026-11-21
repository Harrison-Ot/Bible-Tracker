import { usePage } from '@inertiajs/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';

export default function UserProfileMenu() {
    const { auth } = usePage().props;
    const initials = useInitials();
    if (!auth.user) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-10 rounded-full"
                    aria-label="Open your profile"
                    title="Your profile"
                >
                    <Avatar className="size-9 border">
                        <AvatarImage
                            src={auth.user.avatar_url ?? auth.user.avatar}
                            alt=""
                            className="object-cover"
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                            {initials(auth.user.name)}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-64 max-w-[calc(100vw-2rem)] rounded-xl p-2"
            >
                <UserMenuContent user={auth.user} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
