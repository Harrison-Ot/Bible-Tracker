import {
    createContext,
    useContext,
    useState,
    type Dispatch,
    type ReactNode,
    type SetStateAction,
} from 'react';

const ReadingModeContext = createContext<{
    focused: boolean;
    setFocused: Dispatch<SetStateAction<boolean>>;
} | null>(null);

export function ReadingModeProvider({ children }: { children: ReactNode }) {
    const [focused, setFocused] = useState(false);
    return (
        <ReadingModeContext.Provider value={{ focused, setFocused }}>
            {children}
        </ReadingModeContext.Provider>
    );
}

export function useReadingMode() {
    const context = useContext(ReadingModeContext);
    if (!context) throw new Error('Reading mode requires ReadingModeProvider.');
    return context;
}
