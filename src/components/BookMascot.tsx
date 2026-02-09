export type BookMascotMood = "happy" | "sad" | "curious" | "sleepy";

interface BookMascotProps {
    mood?: BookMascotMood;
    size?: number;
    className?: string;
    label?: string;
}

const moodToAsset: Record<BookMascotMood, string> = {
    happy: "/mascot/pagey-happy.png",
    sad: "/mascot/pagey-sad.png",
    curious: "/mascot/pagey-curious.png",
    sleepy: "/mascot/pagey-sleepy.png",
};

export function BookMascot({
    mood = "happy",
    size = 88,
    className = "",
    label = "Book mascot",
}: BookMascotProps) {
    const src = moodToAsset[mood] || moodToAsset.happy;
    return (
        <img
            src={src}
            alt={label}
            width={size}
            height={size}
            className={`inline-block select-none ${className}`}
            loading="lazy"
            draggable={false}
        />
    );
}
