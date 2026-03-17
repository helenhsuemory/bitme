import React, { useState } from 'react';
import { useAppState, useAppDispatch, useToast } from '../../context/AppContext';
import { Service } from '../../types';

const serviceIcons = ['call', 'psychology', 'videocam', 'groups', 'school', 'code', 'brush', 'edit_note', 'support_agent', 'handshake'];

export default function Services() {
  const { services } = useAppState();
  const dispatch = useAppDispatch();
  const addToast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);

  // Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState(0);
  const [icon, setIcon] = useState('call');

  const openModal = (service?: Service) => {
    if (service) {
      setEditing(service);
      setTitle(service.title);
      setDescription(service.description);
      setDuration(service.durationMinutes);
      setPrice(service.price);
      setIcon(service.icon);
    } else {
      setEditing(null);
      setTitle('');
      setDescription('');
      setDuration(30);
      setPrice(0);
      setIcon('call');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
  };

  const handleSave = () => {
    if (!title.trim()) return;
    if (editing) {
      dispatch({ type: 'UPDATE_SERVICE', payload: { ...editing, title, description, durationMinutes: duration, price, icon } });
      addToast('Service updated');
    } else {
      const newService: Service = {
        id: Date.now().toString(),
        title,
        description,
        durationMinutes: duration,
        price,
        icon,
        isActive: true,
      };
      dispatch({ type: 'ADD_SERVICE', payload: newService });
      addToast('Service created');
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_SERVICE', payload: id });
    addToast('Service deleted');
  };

  const handleToggle = (service: Service) => {
    dispatch({ type: 'UPDATE_SERVICE', payload: { ...service, isActive: !service.isActive } });
    addToast(service.isActive ? 'Service deactivated' : 'Service activated');
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div className="flex flex-col">
        <h2 className="text-slate-900 dark:text-slate-100 text-3xl font-extrabold tracking-tight">My Services</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Configure your bookable meeting types</p>
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">work</span>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {services.filter(s => s.isActive).length} Active Service{services.filter(s => s.isActive).length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Add Service
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map(service => (
          <div key={service.id} className={`bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 rounded-xl p-6 hover:border-primary transition-colors group shadow-sm hover:shadow-md ${!service.isActive ? 'opacity-60' : ''}`}>
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-xl bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-3xl">{service.icon}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openModal(service)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                  <span className="material-symbols-outlined">edit</span>
                </button>
                <button onClick={() => handleDelete(service.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
            <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100 mb-2">{service.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2">{service.description}</p>
            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300 font-medium bg-slate-50 dark:bg-black/20 p-3 rounded-lg mb-6">
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px] text-primary">schedule</span> {service.durationMinutes} mins</span>
              <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px] text-emerald-500">payments</span> {service.price === 0 ? 'Free' : `$${service.price.toFixed(2)}`}</span>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-primary/10 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {service.isActive ? 'Public Link Active' : 'Inactive'}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  checked={service.isActive}
                  onChange={() => handleToggle(service)}
                  className="sr-only peer"
                  type="checkbox"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {editing ? 'Edit Service' : 'Add New Service'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Quick Intro Call"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Brief description..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all dark:text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Duration (min)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={e => setDuration(Math.max(5, parseInt(e.target.value) || 0))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all dark:text-white"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Price ($)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={e => setPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all dark:text-white"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {serviceIcons.map(ic => (
                    <button
                      key={ic}
                      onClick={() => setIcon(ic)}
                      className={`flex items-center justify-center size-10 rounded-xl transition-all ${
                        icon === ic ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{ic}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
              <button onClick={closeModal} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!title.trim()}
                className="px-5 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editing ? 'Save Changes' : 'Add Service'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
