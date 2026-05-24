import { ReactNode } from "react";
import { ToastContainer } from "react-toastify";

interface IAppShellProps {
  children: ReactNode | ReactNode[];
}

export function AppShell(props: IAppShellProps) {
  return (
    <div>
      {props.children}
      <ToastContainer theme="light" />
    </div>
  );
}
