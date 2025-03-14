interface AvatarProps {
  src: string;
}

export function Avatar({ src }: AvatarProps) {
  return <img src={src} alt="user avatar" className="w-7 h-7 rounded-full" />;
}
