import { useEffect } from "react";

export function useMousePosition() {
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const buttons = document.querySelectorAll(".copy-button");

      buttons.forEach((button: HTMLElement) => {
        const rect = button.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        button.style.setProperty("--mouse-x", `${x}%`);
        button.style.setProperty("--mouse-y", `${y}%`);
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);
}
