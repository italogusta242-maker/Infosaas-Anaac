interface InsanoLogoProps {
  size?: number;
  className?: string;
}

const InsanoLogo = ({ size = 24, className = "" }: InsanoLogoProps) => {
  return (
    <div className={`font-sans font-bold tracking-tight text-foreground flex items-center ${className}`} style={{ fontSize: size }}>
      Anaac<span className="font-light ml-1 text-muted-foreground">Club</span>
    </div>
  );
};

export default InsanoLogo;
