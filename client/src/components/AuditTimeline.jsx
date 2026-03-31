import React from 'react';
import { 
  FileText, 
  User, 
  Calendar, 
  CheckCircle, 
  ArrowRight, 
  Play, 
  Send,
  PlusCircle,
  MoreVertical
} from 'lucide-react';

const AuditTimeline = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return <p className="text-gray-500 text-sm italic">No audit history available.</p>;
  }

  const getActionIcon = (action) => {
    switch (action) {
      case 'document.created': return <PlusCircle size={14} className="text-blue-500" />;
      case 'document.picked_up': return <User size={14} className="text-yellow-500" />;
      case 'document.started': return <Play size={14} className="text-orange-500" />;
      case 'document.forwarded': return <Send size={14} className="text-purple-500" />;
      case 'document.completed': return <CheckCircle size={14} className="text-green-500" />;
      default: return <FileText size={14} className="text-gray-500" />;
    }
  };

  const getActionLabel = (action) => {
    return action.split('.').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {logs.map((log, logIdx) => (
          <li key={log.id}>
            <div className="relative pb-8">
              {logIdx !== logs.length - 1 ? (
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center ring-8 ring-white border border-gray-100 shadow-sm">
                    {getActionIcon(log.action)}
                  </span>
                </div>
                <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className="text-sm text-gray-800 font-bold">
                      {getActionLabel(log.action)}
                    </p>
                    {log.metadata && (
                      <div className="mt-1 text-xs text-gray-500 space-y-1">
                        {log.metadata.receiver_department && (
                          <p>Target: <span className="font-semibold text-gray-700">{log.metadata.receiver_department}</span></p>
                        )}
                        {log.metadata.from_department && (
                          <p>From: <span className="font-semibold text-gray-700">{log.metadata.from_department}</span> → <span className="font-semibold text-gray-700">{log.metadata.to_department}</span></p>
                        )}
                        {log.metadata.inward_number && (
                          <p>Inward No: <span className="font-mono text-gray-700">{log.metadata.inward_number}</span></p>
                        )}
                        {log.metadata.new_outward_number && (
                          <p>New Outward No: <span className="font-mono text-gray-700">{log.metadata.new_outward_number}</span></p>
                        )}
                        {log.metadata.note && (
                          <p className="italic bg-gray-50 p-2 rounded border border-gray-100 mt-2">"{log.metadata.note}"</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-xs whitespace-nowrap text-gray-500">
                    <div className="font-medium text-gray-700">{log.actor_name}</div>
                    <time dateTime={log.created_at}>{new Date(log.created_at).toLocaleString()}</time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AuditTimeline;
