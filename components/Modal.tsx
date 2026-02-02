import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  icon?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = '确定',
  cancelText = '取消',
  onConfirm,
  onCancel,
  icon = '🤔'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fadeIn">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      ></div>
      <div className="bg-white rounded-3xl p-6 relative z-10 shadow-2xl max-w-sm w-full animate-scale-in">
        <div className="text-center mb-4">
          <div className="text-5xl mb-3">{icon}</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
          <p className="text-gray-600 text-sm">{message}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  icon?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  title,
  message,
  onClose,
  icon = '✨',
  type = 'info'
}) => {
  if (!isOpen) return null;

  const typeConfig = {
    success: { icon: '🎉', gradient: 'from-green-400 to-emerald-500' },
    error: { icon: '😢', gradient: 'from-red-400 to-rose-500' },
    info: { icon: '✨', gradient: 'from-blue-400 to-indigo-500' },
    warning: { icon: '⚠️', gradient: 'from-yellow-400 to-orange-500' }
  };

  const config = typeConfig[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fadeIn">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="bg-white rounded-3xl p-6 relative z-10 shadow-2xl max-w-sm w-full animate-scale-in">
        <div className="text-center">
          <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r ${config.gradient} flex items-center justify-center text-4xl shadow-lg`}>
            {type === 'success' ? '🎉' : type === 'error' ? '😢' : type === 'warning' ? '⚠️' : icon}
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
          <p className="text-gray-600 text-sm mb-6">{message}</p>
          <button
            onClick={onClose}
            className={`w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r ${config.gradient} hover:opacity-90 transition-all shadow-lg`}
          >
            知道啦
          </button>
        </div>
      </div>
    </div>
  );
};
