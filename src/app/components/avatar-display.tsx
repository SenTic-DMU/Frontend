import { User, UserRound, Baby, Bot, PersonStanding } from "lucide-react";

export type AvatarType = "male" | "female" | "child" | "elderly" | "robot" | "custom";

interface AvatarDisplayProps {
  avatarType: AvatarType;
  customAvatar?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function AvatarDisplay({ avatarType, customAvatar, size = "md", className = "" }: AvatarDisplayProps) {
  const sizeClasses = { sm: "w-8 h-8", md: "w-12 h-12", lg: "w-20 h-20", xl: "w-36 h-36" };
  const iconSizes = { sm: 16, md: 22, lg: 36, xl: 64 };

  const avatarBg: Record<AvatarType, string> = {
    male: "bg-blue-50",
    female: "bg-pink-50",
    child: "bg-yellow-50",
    elderly: "bg-orange-50",
    robot: "bg-purple-50",
    custom: "bg-gray-50",
  };

  const avatarColor: Record<AvatarType, string> = {
    male: "text-blue-500",
    female: "text-pink-500",
    child: "text-yellow-500",
    elderly: "text-orange-500",
    robot: "text-purple-500",
    custom: "text-gray-400",
  };

  const getIcon = () => {
    switch (avatarType) {
      case "male": return User;
      case "female": return UserRound;
      case "child": return Baby;
      case "elderly": return PersonStanding;
      case "robot": return Bot;
      default: return User;
    }
  };

  const IconComponent = getIcon();

  return (
    <div className={`${sizeClasses[size]} rounded-xl ${avatarBg[avatarType]} flex items-center justify-center overflow-hidden flex-shrink-0 ${className}`}>
      {avatarType === "custom" && customAvatar ? (
        <img src={customAvatar} alt="프로필" className="w-full h-full object-cover" />
      ) : (
        <IconComponent size={iconSizes[size]} className={avatarColor[avatarType]} />
      )}
    </div>
  );
}
