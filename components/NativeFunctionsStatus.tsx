import { IconShieldCheck } from "@tabler/icons-react";
import { motion } from "framer-motion";
import "~/styles/components/NativeFunctionsStatus.scss";

export const NativeFunctionsStatus = () => {
  return (
    <div className="native-functions-status">
      <div className="status-content">
        <div className="status-icon">
          <IconShieldCheck size={20} />
        </div>
        <div className="status-text">
          <span className="status-title">原生函数保护已启用</span>
          <span className="status-description">
            已保护浏览器原生函数，防止被网页篡改
          </span>
        </div>
      </div>
    </div>
  );
};
