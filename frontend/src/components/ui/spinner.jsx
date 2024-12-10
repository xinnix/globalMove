const Spinner = ({ className = "", size = "default" }) => {
  const sizeClasses = {
    default: "h-4 w-4",
    sm: "h-3 w-3",
    lg: "h-6 w-6",
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${
        sizeClasses[size]
      } ${className}`}
      role="status"
      aria-label="loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export { Spinner };
