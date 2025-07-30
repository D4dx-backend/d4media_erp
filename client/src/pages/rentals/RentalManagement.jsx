import React, { useState, useEffect } from 'react';
import { getRentals, createRental, updateRental, deleteRental, getAvailableEquipment, returnEquipment } from '../../services/rentalService';
import { getUsers } from '../../services/userService';
import { createRentalInvoice, sendInvoiceToCustomer, generateInvoicePDF } from '../../services/invoiceService';
import { createQuotation } from '../../services/quotationService';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { format } from 'date-fns';

const RentalManagement = () => {
  const [rentals, setRentals] = useState([]);
  const [clients, setClients] = useState([]);
  const [availableEquipment, setAvailableEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [editingRental, setEditingRental] = useState(null);
  const [returningEquipment, setReturningEquipment] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    client: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  const [formData, setFormData] = useState({
    client: '',
    contactPerson: {
      name: '',
      phone: '',
      email: ''
    },
    rentalDate: '',
    returnDate: '',
    equipment: [],
    purpose: '',
    deliveryAddress: '',
    deliveryRequired: false,
    pickupRequired: false,
    notes: '',
    pricing: {
      securityDeposit: 0,
      discount: 0
    }
  });

  const [returnData, setReturnData] = useState({
    condition: 'good',
    notes: '',
    quantity: 1
  });

  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signingRental, setSigningRental] = useState(null);
  const [signatureData, setSignatureData] = useState({
    clientSignature: '',
    representativeSignature: '',
    signedDate: ''
  });

  // Confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingRental, setDeletingRental] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch data
  useEffect(() => {
    fetchRentals();
    fetchClients();
  }, [filters]);

  // Generate mock rentals for testing
  const generateMockRentals = () => {
    const today = new Date();
    return [
      {
        _id: '507f1f77bcf86cd799439021',
        client: {
          _id: '507f1f77bcf86cd799439031',
          name: 'ABC Productions'
        },
        contactPerson: {
          name: 'John Smith',
          phone: '555-123-4567'
        },
        rentalDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        returnDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        equipment: [
          {
            equipmentId: {
              _id: '507f1f77bcf86cd799439011',
              name: 'Professional Camera Kit'
            },
            quantity: 1,
            rate: 1500,
            totalAmount: 1500,
            status: 'rented'
          }
        ],
        status: 'rented',
        pricing: {
          totalAmount: 1500
        },
        purpose: 'Video production'
      },
      {
        _id: '507f1f77bcf86cd799439022',
        client: {
          _id: '507f1f77bcf86cd799439032',
          name: 'XYZ Events'
        },
        contactPerson: {
          name: 'Jane Doe',
          phone: '555-987-6543'
        },
        rentalDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        returnDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        equipment: [
          {
            equipmentId: {
              _id: '507f1f77bcf86cd799439012',
              name: 'Audio Recording Setup'
            },
            quantity: 1,
            rate: 1200,
            totalAmount: 1200,
            status: 'returned'
          }
        ],
        status: 'completed',
        pricing: {
          totalAmount: 1200
        },
        purpose: 'Corporate event'
      }
    ];
  };

  const fetchRentals = async () => {
    try {
      setLoading(true);
      
      // Add a timestamp to prevent caching
      const timestamp = new Date().getTime();
      const queryParams = { ...filters, _t: timestamp };
      
      console.log('Fetching rentals with filters:', queryParams);
      const response = await getRentals(queryParams);
      console.log('Rentals response:', response);
      
      if (response.success && Array.isArray(response.data) && response.data.length > 0) {
        // Remove duplicates based on _id
        const uniqueRentals = response.data.filter((rental, index, self) => 
          index === self.findIndex(r => r._id === rental._id)
        );
        setRentals(uniqueRentals);
      } else {
        // If no data from API, use mock data
        console.log('No rental API data, using mock rentals');
        setRentals(generateMockRentals());
      }
    } catch (error) {
      console.error('Error fetching rentals:', error);
      // If API fails, use mock data
      setRentals(generateMockRentals());
    } finally {
      setLoading(false);
    }
  };

  // Generate mock clients for testing
  const generateMockClients = () => {
    return [
      {
        _id: '507f1f77bcf86cd799439031',
        name: 'ABC Productions',
        email: 'contact@abcproductions.com',
        company: 'ABC Productions'
      },
      {
        _id: '507f1f77bcf86cd799439032',
        name: 'XYZ Events',
        email: 'info@xyzevents.com',
        company: 'XYZ Events'
      },
      {
        _id: '507f1f77bcf86cd799439033',
        name: 'Creative Studios',
        email: 'hello@creativestudios.com',
        company: 'Creative Studios'
      }
    ];
  };

  const fetchClients = async () => {
    try {
      const response = await getUsers({ role: 'client' });
      if (response.data && response.data.length > 0) {
        setClients(response.data);
      } else {
        // If no data from API, use mock data
        console.log('No client API data, using mock clients');
        setClients(generateMockClients());
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      // If API fails, use mock data
      setClients(generateMockClients());
    }
  };

  // Generate mock equipment for testing
  const generateMockEquipment = () => {
    return [
      {
        _id: '507f1f77bcf86cd799439011',
        name: 'Professional Camera Kit',
        category: 'video',
        availableQuantity: 3,
        rentalPricing: {
          dailyRate: 1500,
          weeklyRate: 8000
        }
      },
      {
        _id: '507f1f77bcf86cd799439012',
        name: 'Audio Recording Setup',
        category: 'audio',
        availableQuantity: 2,
        rentalPricing: {
          dailyRate: 1200,
          weeklyRate: 6000
        }
      },
      {
        _id: '507f1f77bcf86cd799439013',
        name: 'Lighting Equipment',
        category: 'lighting',
        availableQuantity: 4,
        rentalPricing: {
          dailyRate: 800,
          weeklyRate: 4000
        }
      },
      {
        _id: '507f1f77bcf86cd799439014',
        name: 'Wireless Microphone Set',
        category: 'audio',
        availableQuantity: 5,
        rentalPricing: {
          dailyRate: 500,
          weeklyRate: 2500
        }
      }
    ];
  };

  const fetchAvailableEquipment = async (startDate, endDate) => {
    try {
      console.log('Fetching available equipment for dates:', { startDate, endDate });
      const response = await getAvailableEquipment(startDate, endDate);
      console.log('Available equipment response:', response);
      
      if (response.success && Array.isArray(response.data) && response.data.length > 0) {
        setAvailableEquipment(response.data);
      } else {
        // If no data from API, use mock data
        console.log('No equipment API data, using mock equipment');
        setAvailableEquipment(generateMockEquipment());
      }
    } catch (error) {
      console.error('Error fetching available equipment:', error);
      // If API fails, use mock data
      setAvailableEquipment(generateMockEquipment());
    }
  };

  // Handle form changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Handle equipment selection
  const handleEquipmentChange = (equipmentId, quantity, rate) => {
    const parsedQuantity = parseInt(quantity) || 0;
    
    setFormData(prev => {
      const existingIndex = prev.equipment.findIndex(item => item.equipmentId === equipmentId);
      const newEquipment = [...prev.equipment];
      
      if (parsedQuantity === 0) {
        // Remove equipment if quantity is 0
        if (existingIndex >= 0) {
          newEquipment.splice(existingIndex, 1);
        }
      } else {
        // Find the equipment object to get its full details
        const equipmentItem = availableEquipment.find(item => item._id === equipmentId);
        
        if (!equipmentItem) {
          console.error('Equipment not found:', equipmentId);
          return prev;
        }
        
        // Calculate rental days for proper pricing
        const rentalDays = formData.rentalDate && formData.returnDate 
          ? Math.ceil((new Date(formData.returnDate) - new Date(formData.rentalDate)) / (1000 * 60 * 60 * 24)) 
          : 1;
        
        const totalAmount = parsedQuantity * parseFloat(rate) * rentalDays;
        
        const equipmentData = {
          equipment: equipmentItem, // Send the full equipment object
          equipmentId: equipmentItem._id, // This is the valid ObjectId
          quantity: parsedQuantity,
          rate: parseFloat(rate),
          totalAmount
        };
        
        if (existingIndex >= 0) {
          // Update existing item
          newEquipment[existingIndex] = equipmentData;
        } else {
          // Add new item
          newEquipment.push(equipmentData);
        }
      }
      
      return { ...prev, equipment: newEquipment };
    });
  };

  // Calculate total cost
  const calculateTotal = () => {
    const subtotal = formData.equipment.reduce((sum, item) => sum + item.totalAmount, 0);
    const total = subtotal - formData.pricing.discount + formData.pricing.securityDeposit;
    return { subtotal, total };
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { subtotal, total } = calculateTotal();
      
      // Ensure all required fields are present
      if (!formData.client) {
        toast.error('Please select a client');
        setLoading(false);
        return;
      }
      
      if (!formData.contactPerson.name) {
        toast.error('Contact person name is required');
        setLoading(false);
        return;
      }
      
      if (!formData.contactPerson.phone) {
        toast.error('Contact person phone is required');
        setLoading(false);
        return;
      }
      
      if (!formData.rentalDate || !formData.returnDate) {
        toast.error('Rental and return dates are required');
        setLoading(false);
        return;
      }
      
      if (formData.equipment.length === 0) {
        toast.error('Please select at least one equipment item');
        setLoading(false);
        return;
      }
      
      if (!formData.purpose) {
        // Set a default purpose if not provided
        formData.purpose = 'Equipment rental';
      }
      
      const rentalData = {
        ...formData,
        pricing: {
          ...formData.pricing,
          subtotal,
          totalAmount: total
        }
      };
      
      console.log('Submitting rental data:', rentalData);
      console.log('Equipment data being sent:', rentalData.equipment);

      let response;
      if (editingRental) {
        response = await updateRental(editingRental._id, rentalData);
      } else {
        response = await createRental(rentalData);
      }
      
      console.log('Rental response:', response);

      if (response.success) {
        toast.success(`Rental ${editingRental ? 'updated' : 'created'} successfully!`);
        setShowForm(false);
        setEditingRental(null);
        resetForm();
        
        // Add a small delay before fetching rentals to ensure the server has processed the change
        setTimeout(() => {
          fetchRentals();
        }, 500);
      } else {
        if (response.errors && Array.isArray(response.errors)) {
          response.errors.forEach(error => toast.error(error));
        } else {
          toast.error(response.error || `Failed to ${editingRental ? 'update' : 'create'} rental`);
        }
      }
    } catch (error) {
      console.error('Error submitting rental:', error);
      toast.error(`Failed to ${editingRental ? 'update' : 'create'} rental`);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete rental
  const handleDeleteRental = async () => {
    if (!deletingRental) return;
    
    try {
      setDeleteLoading(true);
      const response = await deleteRental(deletingRental._id);
      if (response.success) {
        toast.success('Rental deleted successfully!');
        fetchRentals();
        setShowDeleteConfirm(false);
        setDeletingRental(null);
      } else {
        toast.error(response.error || 'Failed to delete rental');
      }
    } catch (error) {
      console.error('Error deleting rental:', error);
      toast.error('Failed to delete rental');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Show delete confirmation
  const showDeleteConfirmation = (rental) => {
    setDeletingRental(rental);
    setShowDeleteConfirm(true);
  };

  // Handle status update
  const handleStatusUpdate = async (rentalId, newStatus) => {
    try {
      const response = await updateRental(rentalId, { status: newStatus });
      if (response.success) {
        toast.success(`Rental status updated to ${newStatus}`);
        
        // Check if invoice was auto-created
        if (newStatus === 'confirmed' && response.data?.invoice) {
          toast.success('Invoice automatically created for confirmed rental!');
        }
        
        fetchRentals();
      } else {
        toast.error(response.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  // Handle create invoice for rental
  const handleCreateInvoice = async (rental) => {
    try {
      // Check if this is mock data (fake ID)
      if (rental._id.startsWith('507f1f77bcf86cd799439')) {
        toast.error('Cannot create invoice for demo data. Please create a real rental first.');
        return;
      }
      
      // Validate that it's a proper MongoDB ObjectId
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(rental._id);
      if (!isValidObjectId) {
        toast.error('Invalid rental ID. Cannot create invoice for demo data.');
        return;
      }
      
      console.log('Creating invoice for rental:', rental._id);
      console.log('Rental data:', rental);
      
      const response = await createRentalInvoice(rental._id);
      console.log('Invoice creation response:', response);
      
      if (response.success) {
        toast.success('Invoice created successfully!');
        fetchRentals(); // Refresh the rentals list
      } else {
        console.error('Invoice creation failed:', response);
        toast.error(response.message || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      console.error('Error details:', error);
      toast.error(error.message || 'Failed to create invoice');
    }
  };

  // Handle create quotation for rental
  const handleCreateQuotation = async (rental) => {
    try {
      // Check if this is mock data (fake ID)
      if (rental._id.startsWith('507f1f77bcf86cd799439')) {
        toast.error('Cannot create quotation for demo data. Please create a real rental first.');
        return;
      }
      
      // Validate that it's a proper MongoDB ObjectId
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(rental._id);
      if (!isValidObjectId) {
        toast.error('Invalid rental ID. Cannot create quotation for demo data.');
        return;
      }

      // Create quotation data from rental
      const quotationData = {
        client: rental.client._id || rental.client,
        clientDetails: {
          name: rental.client?.name || rental.contactPerson?.name,
          email: rental.client?.email || rental.contactPerson?.email,
          phone: rental.contactPerson?.phone,
          company: rental.client?.company
        },
        items: rental.equipment.map(item => ({
          type: 'equipment_rental',
          description: `Equipment Rental: ${item.equipmentId?.name || 'Unknown Equipment'} (${rental.durationDays || 1} days)`,
          quantity: item.quantity || 1,
          rate: item.rate || 0,
          amount: item.totalAmount || (item.quantity * item.rate)
        })),
        subtotal: rental.pricing?.subtotal || 0,
        discount: rental.pricing?.discount || 0,
        tax: 0,
        total: rental.pricing?.totalAmount || 0,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        notes: `Quotation for equipment rental: ${rental.purpose}${rental.notes ? `\n\nRental Notes: ${rental.notes}` : ''}`,
        reference: rental._id
      };

      const response = await createQuotation(quotationData);
      
      if (response.success) {
        toast.success('Quotation created successfully!');
        fetchRentals(); // Refresh the rentals list
      } else {
        console.error('Quotation creation failed:', response);
        toast.error(response.message || 'Failed to create quotation');
      }
    } catch (error) {
      console.error('Error creating quotation:', error);
      toast.error(error.message || 'Failed to create quotation');
    }
  };

  // Handle send invoice via WhatsApp
  const handleSendInvoice = async (rental) => {
    try {
      if (!rental.invoice) {
        toast.error('No invoice found for this rental. Please create an invoice first.');
        return;
      }

      const response = await sendInvoiceToCustomer(rental.invoice);
      
      if (response.success) {
        toast.success('Invoice sent successfully via WhatsApp!');
      } else {
        toast.error(response.message || 'Failed to send invoice');
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error(error.message || 'Failed to send invoice');
    }
  };

  // Handle download invoice PDF
  const handleDownloadInvoice = async (rental) => {
    try {
      if (!rental.invoice) {
        toast.error('No invoice found for this rental. Please create an invoice first.');
        return;
      }

      const response = await generateInvoicePDF(rental.invoice);
      
      // Create blob and download
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rental-invoice-${rental._id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Invoice PDF downloaded successfully!');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error(error.message || 'Failed to download invoice');
    }
  };

  // Handle print rental
  const handlePrintRental = (rental) => {
    const printWindow = window.open('', '_blank');
    const printContent = generatePrintContent(rental);
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  // Generate print content
  const generatePrintContent = (rental) => {
    const equipmentList = rental.equipment?.map(item => 
      `<tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.equipmentId?.name || 'Unknown'}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${item.rate}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${item.totalAmount}</td>
      </tr>`
    ).join('') || '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rental Agreement - ${rental._id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 20px; }
          .signature-section { margin-top: 50px; display: flex; justify-content: space-between; }
          .signature-box { border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>D4 MEDIA</h1>
          <h2>Equipment Rental Agreement</h2>
          <p>Rental ID: ${rental._id}</p>
        </div>
        
        <div class="section">
          <h3>Client Information</h3>
          <p><strong>Client:</strong> ${rental.client?.name || 'N/A'}</p>
          <p><strong>Company:</strong> ${rental.client?.company || 'N/A'}</p>
          <p><strong>Contact Person:</strong> ${rental.contactPerson?.name || 'N/A'}</p>
          <p><strong>Phone:</strong> ${rental.contactPerson?.phone || 'N/A'}</p>
          <p><strong>Email:</strong> ${rental.contactPerson?.email || 'N/A'}</p>
        </div>
        
        <div class="section">
          <h3>Rental Details</h3>
          <p><strong>Rental Date:</strong> ${rental.rentalDate ? format(new Date(rental.rentalDate), 'MMM dd, yyyy') : 'N/A'}</p>
          <p><strong>Return Date:</strong> ${rental.returnDate ? format(new Date(rental.returnDate), 'MMM dd, yyyy') : 'N/A'}</p>
          <p><strong>Purpose:</strong> ${rental.purpose || 'N/A'}</p>
          <p><strong>Status:</strong> ${rental.status || 'pending'}</p>
        </div>
        
        <div class="section">
          <h3>Equipment Details</h3>
          <table>
            <thead>
              <tr>
                <th>Equipment</th>
                <th>Quantity</th>
                <th>Rate (per day)</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${equipmentList}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h3>Payment Summary</h3>
          <p><strong>Subtotal:</strong> ₹${rental.pricing?.subtotal || 0}</p>
          <p><strong>Security Deposit:</strong> ₹${rental.pricing?.securityDeposit || 0}</p>
          <p><strong>Discount:</strong> ₹${rental.pricing?.discount || 0}</p>
          <p><strong>Total Amount:</strong> ₹${rental.pricing?.totalAmount || 0}</p>
        </div>
        
        ${rental.notes ? `
        <div class="section">
          <h3>Notes</h3>
          <p>${rental.notes}</p>
        </div>
        ` : ''}
        
        <div class="signature-section">
          <div>
            <div class="signature-box">
              ${rental.signatures?.clientSignature || 'Client Signature'}
            </div>
            <p>Date: ${rental.signatures?.signedDate ? format(new Date(rental.signatures.signedDate), 'MMM dd, yyyy') : '___________'}</p>
          </div>
          <div>
            <div class="signature-box">
              ${rental.signatures?.representativeSignature || 'D4 Media Representative'}
            </div>
            <p>Date: ${rental.signatures?.signedDate ? format(new Date(rental.signatures.signedDate), 'MMM dd, yyyy') : '___________'}</p>
          </div>
        </div>
        
        <div style="margin-top: 30px; font-size: 12px; color: #666;">
          <p><strong>Terms & Conditions:</strong></p>
          <ul>
            <li>Equipment must be returned in the same condition as rented</li>
            <li>Any damage or loss will be charged separately</li>
            <li>Late returns may incur additional charges</li>
            <li>Security deposit will be refunded upon satisfactory return</li>
          </ul>
        </div>
      </body>
      </html>
    `;
  };

  // Handle signature
  const handleSignRental = (rental) => {
    setSigningRental(rental);
    setSignatureData({
      clientSignature: rental.signatures?.clientSignature || '',
      representativeSignature: rental.signatures?.representativeSignature || '',
      signedDate: rental.signatures?.signedDate || new Date().toISOString().split('T')[0]
    });
    setShowSignatureModal(true);
  };

  const handleSaveSignature = async () => {
    try {
      const response = await updateRental(signingRental._id, {
        signatures: signatureData,
        status: 'confirmed' // Auto-confirm when signed
      });
      
      if (response.success) {
        toast.success('Rental signed successfully!');
        setShowSignatureModal(false);
        setSigningRental(null);
        fetchRentals();
      } else {
        toast.error(response.error || 'Failed to save signature');
      }
    } catch (error) {
      console.error('Error saving signature:', error);
      toast.error('Failed to save signature');
    }
  };

  // Handle equipment return
  const handleReturnEquipment = async () => {
    try {
      const response = await returnEquipment(
        returningEquipment.rentalId,
        returningEquipment.equipmentId,
        returnData
      );

      if (response.success) {
        toast.success('Equipment returned successfully!');
        setShowReturnModal(false);
        setReturningEquipment(null);
        setReturnData({ condition: 'good', notes: '', quantity: 1 });
        fetchRentals();
      } else {
        toast.error(response.error || 'Failed to return equipment');
      }
    } catch (error) {
      console.error('Error returning equipment:', error);
      toast.error('Failed to return equipment');
    }
  };

  // Handle partial return
  const handlePartialReturn = (rental, equipment) => {
    setReturningEquipment({
      rentalId: rental._id,
      equipmentId: equipment.equipmentId?._id || equipment.equipmentId,
      equipmentName: equipment.equipmentId?.name || 'Unknown Equipment',
      totalQuantity: equipment.quantity,
      returnedQuantity: equipment.returnedQuantity || 0
    });
    setReturnData({ 
      condition: 'good', 
      notes: '',
      quantity: equipment.quantity - (equipment.returnedQuantity || 0)
    });
    setShowReturnModal(true);
  };

  const resetForm = () => {
    setFormData({
      client: '',
      contactPerson: { name: '', phone: '', email: '' },
      rentalDate: '',
      returnDate: '',
      equipment: [],
      purpose: '',
      deliveryAddress: '',
      deliveryRequired: false,
      pickupRequired: false,
      notes: '',
      pricing: { securityDeposit: 0, discount: 0 }
    });
    
    // Also reset available equipment
    setAvailableEquipment([]);
  };

  // Handle edit rental
  const handleEditRental = async (rental) => {
    setEditingRental(rental);
    
    // Format dates for input fields
    const rentalDate = rental.rentalDate ? new Date(rental.rentalDate).toISOString().split('T')[0] : '';
    const returnDate = rental.returnDate ? new Date(rental.returnDate).toISOString().split('T')[0] : '';
    
    // First fetch available equipment for the dates
    if (rentalDate && returnDate) {
      await fetchAvailableEquipment(rentalDate, returnDate);
    }
    
    setFormData({
      client: rental.client?._id || rental.client || '',
      contactPerson: {
        name: rental.contactPerson?.name || '',
        phone: rental.contactPerson?.phone || '',
        email: rental.contactPerson?.email || ''
      },
      rentalDate,
      returnDate,
      equipment: rental.equipment?.map(item => ({
        equipmentId: item.equipmentId?._id || item.equipmentId,
        equipment: item.equipmentId,
        quantity: item.quantity || 0,
        rate: item.rate || 0,
        totalAmount: item.totalAmount || 0
      })) || [],
      purpose: rental.purpose || '',
      deliveryAddress: rental.deliveryAddress || '',
      deliveryRequired: rental.deliveryRequired || false,
      pickupRequired: rental.pickupRequired || false,
      notes: rental.notes || '',
      pricing: {
        securityDeposit: rental.pricing?.securityDeposit || 0,
        discount: rental.pricing?.discount || 0
      }
    });
    
    setShowForm(true);
  };

  // Handle date changes to fetch available equipment
  useEffect(() => {
    if (formData.rentalDate && formData.returnDate) {
      fetchAvailableEquipment(formData.rentalDate, formData.returnDate);
    }
  }, [formData.rentalDate, formData.returnDate]);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    rented: 'bg-green-100 text-green-800',
    partially_returned: 'bg-orange-100 text-orange-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Equipment Rentals</h1>
          <p className="text-gray-600 mt-2">
            Manage equipment rentals and track returns.
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingRental(null);
            resetForm();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          New Rental
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search rentals..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="rented">Rented</option>
              <option value="partially_returned">Partially Returned</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
            <select
              value={filters.client}
              onChange={(e) => setFilters(prev => ({ ...prev, client: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Clients</option>
              {clients.map(client => (
                <option key={client._id} value={client._id}>
                  {client.name || client.company || 'Unnamed Client'} 
                  {client.company && client.name !== client.company && ` (${client.company})`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Rental Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {editingRental ? 'Edit Rental' : 'New Rental'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Client & Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client *
                    </label>
                    <select
                      name="client"
                      value={formData.client}
                      onChange={(e) => {
                        handleInputChange(e);
                        // Auto-fill contact person if client is selected
                        const selectedClient = clients.find(c => c._id === e.target.value);
                        if (selectedClient && !formData.contactPerson.name) {
                          setFormData(prev => ({
                            ...prev,
                            contactPerson: {
                              ...prev.contactPerson,
                              name: selectedClient.name,
                              email: selectedClient.email || ''
                            }
                          }));
                        }
                      }}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Client</option>
                      {clients.map(client => (
                        <option key={client._id} value={client._id}>
                          {client.name || client.company || 'Unnamed Client'} 
                          {client.company && client.name !== client.company && ` (${client.company})`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      name="contactPerson.name"
                      value={formData.contactPerson.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Contact person name"
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rental Date *
                    </label>
                    <input
                      type="date"
                      name="rentalDate"
                      value={formData.rentalDate}
                      onChange={handleInputChange}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Return Date *
                    </label>
                    <input
                      type="date"
                      name="returnDate"
                      value={formData.returnDate}
                      onChange={handleInputChange}
                      required
                      min={formData.rentalDate || new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Contact Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      name="contactPerson.phone"
                      value={formData.contactPerson.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Contact phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      name="contactPerson.email"
                      value={formData.contactPerson.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Contact email address (optional)"
                    />
                  </div>
                </div>

                {/* Purpose */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purpose
                  </label>
                  <input
                    type="text"
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Purpose of rental"
                  />
                </div>

                {/* Equipment Selection */}
                {availableEquipment.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Available Equipment</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {availableEquipment.map(equipment => {
                        const selectedItem = formData.equipment.find(item => item.equipmentId === equipment._id);
                        return (
                          <div key={equipment._id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium">{equipment.name}</div>
                              <div className="text-sm text-gray-500">
                                ₹{equipment.rentalPricing?.dailyRate}/day
                                {equipment.rentalPricing?.weeklyRate && ` • ₹${equipment.rentalPricing.weeklyRate}/week`}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min="0"
                                max={equipment.availableQuantity}
                                value={selectedItem?.quantity || 0}
                                onChange={(e) => handleEquipmentChange(
                                  equipment._id,
                                  e.target.value,
                                  equipment.rentalPricing?.dailyRate || 0
                                )}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                                placeholder="Qty"
                              />
                              <span className="text-sm text-gray-500">
                                ₹{selectedItem ? (selectedItem.quantity * selectedItem.rate * (formData.rentalDate && formData.returnDate 
                                  ? Math.ceil((new Date(formData.returnDate) - new Date(formData.rentalDate)) / (1000 * 60 * 60 * 24)) 
                                  : 1)) : 0}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Additional Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Security Deposit (₹)
                    </label>
                    <input
                      type="number"
                      name="pricing.securityDeposit"
                      value={formData.pricing.securityDeposit}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount (₹)
                    </label>
                    <input
                      type="number"
                      name="pricing.discount"
                      value={formData.pricing.discount}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Cost Summary */}
                {formData.equipment.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Cost Summary</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₹{calculateTotal().subtotal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Security Deposit:</span>
                        <span>₹{formData.pricing.securityDeposit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span>-₹{formData.pricing.discount}</span>
                      </div>
                      <div className="flex justify-between font-medium text-lg border-t pt-1">
                        <span>Total:</span>
                        <span>₹{calculateTotal().total}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || formData.equipment.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : (editingRental ? 'Update' : 'Create')} Rental
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Rentals List */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rental Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rentals
                  .filter(rental => {
                    const searchTerm = filters.search.toLowerCase();
                    const clientName = rental.client?.name?.toLowerCase() || '';
                    const contactName = rental.contactPerson?.name?.toLowerCase() || '';
                    const purpose = rental.purpose?.toLowerCase() || '';
                    
                    const matchesSearch = !filters.search || 
                      clientName.includes(searchTerm) || 
                      contactName.includes(searchTerm) || 
                      purpose.includes(searchTerm);
                    
                    const matchesStatus = !filters.status || rental.status === filters.status;
                    const matchesClient = !filters.client || rental.client?._id === filters.client;
                    
                    return matchesSearch && matchesStatus && matchesClient;
                  })
                  .map((rental) => (
                    <tr key={rental._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {rental.client?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {rental.client?.company}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {rental.contactPerson?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {rental.contactPerson?.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          {rental.rentalDate ? format(new Date(rental.rentalDate), 'MMM dd, yyyy') : 'N/A'}
                        </div>
                        <div className="text-gray-500">
                          to {rental.returnDate ? format(new Date(rental.returnDate), 'MMM dd, yyyy') : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {rental.equipment?.length || 0} item(s)
                        </div>
                        <div className="text-xs text-gray-500">
                          {rental.equipment?.slice(0, 2).map(item => 
                            item.equipmentId?.name || 'Unknown'
                          ).join(', ')}
                          {rental.equipment?.length > 2 && '...'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[rental.status] || 'bg-gray-100 text-gray-800'}`}>
                          {rental.status?.replace('_', ' ') || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{rental.pricing?.totalAmount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col space-y-2">
                          {/* Primary Actions Row */}
                          <div className="flex flex-wrap gap-1">
                            <button
                              onClick={() => handleEditRental(rental)}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              title="Edit Rental"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handlePrintRental(rental)}
                              className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                              title="Print Rental Agreement"
                            >
                              Print
                            </button>
                            <button
                              onClick={() => handleSignRental(rental)}
                              className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                              title="Digital Signature"
                            >
                              Sign
                            </button>
                          </div>

                          {/* Invoice & Quotation Actions Row */}
                          <div className="flex flex-wrap gap-1">
                            {/* Quotation Button - Always available for confirmed+ rentals */}
                            {['confirmed', 'rented', 'partially_returned', 'completed'].includes(rental.status) && 
                             /^[0-9a-fA-F]{24}$/.test(rental._id) && (
                              <button
                                onClick={() => handleCreateQuotation(rental)}
                                className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                                title="Create Quotation"
                              >
                                Quote
                              </button>
                            )}

                            {/* Invoice Actions */}
                            {['confirmed', 'rented', 'partially_returned', 'completed'].includes(rental.status) && 
                             /^[0-9a-fA-F]{24}$/.test(rental._id) && (
                              <>
                                {!rental.invoice ? (
                                  <button
                                    onClick={() => handleCreateInvoice(rental)}
                                    className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                                    title="Create Invoice"
                                  >
                                    Invoice
                                  </button>
                                ) : (
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleSendInvoice(rental)}
                                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                      title="Send Invoice via WhatsApp"
                                    >
                                      📱 Send
                                    </button>
                                    <button
                                      onClick={() => handleDownloadInvoice(rental)}
                                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                      title="Download Invoice PDF"
                                    >
                                      📄 PDF
                                    </button>
                                  </div>
                                )}
                              </>
                            )}

                            {/* Return Equipment Dropdown */}
                            {(rental.status === 'rented' || rental.status === 'partially_returned') && (
                              <div className="relative group">
                                <button className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200">
                                  Return ▼
                                </button>
                                <div className="absolute left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 hidden group-hover:block">
                                  {rental.equipment?.map((equipment, idx) => {
                                    const remainingQty = equipment.quantity - (equipment.returnedQuantity || 0);
                                    if (remainingQty <= 0) return null;
                                    
                                    return (
                                      <button
                                        key={idx}
                                        onClick={() => handlePartialReturn(rental, equipment)}
                                        className="block w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
                                      >
                                        {equipment.equipmentId?.name || 'Unknown'} ({remainingQty} left)
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Status & Delete Actions Row */}
                          <div className="flex gap-1 items-center">
                            {rental.status !== 'completed' && rental.status !== 'cancelled' && (
                              <select
                                value={rental.status}
                                onChange={(e) => handleStatusUpdate(rental._id, e.target.value)}
                                className="text-xs border border-gray-300 rounded px-1 py-0.5 bg-white"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="rented">Rented</option>
                                <option value="partially_returned">Partially Returned</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            )}
                            <button
                              onClick={() => showDeleteConfirmation(rental)}
                              className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                              title="Delete Rental"
                            >
                              Delete
                            </button>
                          </div>

                          {/* Status Indicators */}
                          {rental.invoice && (
                            <div className="text-xs text-green-600 font-medium">
                              ✓ Invoice Created
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            
            {rentals.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No rentals found. Create your first rental to get started.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Return Equipment Modal */}
      {showReturnModal && returningEquipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Return Equipment</h2>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-700">
                  <strong>Equipment:</strong> {returningEquipment.equipmentName || 'Unknown Equipment'}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Total Quantity:</strong> {returningEquipment.totalQuantity || 1}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Already Returned:</strong> {returningEquipment.returnedQuantity || 0}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Available to Return:</strong> {(returningEquipment.totalQuantity || 1) - (returningEquipment.returnedQuantity || 0)}
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity to Return
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={(returningEquipment.totalQuantity || 1) - (returningEquipment.returnedQuantity || 0)}
                    value={returnData.quantity}
                    onChange={(e) => setReturnData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Condition
                  </label>
                  <select
                    value={returnData.condition}
                    onChange={(e) => setReturnData(prev => ({ ...prev, condition: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="damaged">Damaged</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={returnData.notes}
                    onChange={(e) => setReturnData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Any notes about the equipment condition..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReturnEquipment}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Confirm Return
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rentals List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Rentals ({rentals.length})</h2>
          </div>
          {rentals.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No rentals found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rental Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Equipment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rentals.map((rental) => (
                    <tr key={rental._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {rental.client?.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {rental.contactPerson.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          {format(new Date(rental.rentalDate), 'MMM d, yyyy')}
                        </div>
                        <div className="text-gray-500">
                          to {format(new Date(rental.returnDate), 'MMM d, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {rental.equipment.length} items
                        </div>
                        <div className="text-sm text-gray-500">
                          {rental.equipment.slice(0, 2).map(item => 
                            item.equipmentId?.name
                          ).join(', ')}
                          {rental.equipment.length > 2 && '...'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{rental.pricing.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[rental.status]}`}>
                          {rental.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {rental.status === 'rented' && rental.equipment.some(item => item.status === 'rented') && (
                          <button
                            onClick={() => {
                              const rentedItem = rental.equipment.find(item => item.status === 'rented');
                              setReturningEquipment({
                                rentalId: rental._id,
                                equipmentId: rentedItem.equipmentId._id
                              });
                              setShowReturnModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            Return
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingRental(rental);
                            setFormData({
                              client: rental.client._id,
                              contactPerson: rental.contactPerson,
                              rentalDate: rental.rentalDate.split('T')[0],
                              returnDate: rental.returnDate.split('T')[0],
                              equipment: rental.equipment.map(item => ({
                                equipmentId: item.equipmentId._id,
                                quantity: item.quantity,
                                rate: item.rate,
                                totalAmount: item.totalAmount
                              })),
                              purpose: rental.purpose,
                              deliveryAddress: rental.deliveryAddress || '',
                              deliveryRequired: rental.deliveryRequired,
                              pickupRequired: rental.pickupRequired,
                              notes: rental.notes || '',
                              pricing: rental.pricing
                            });
                            setShowForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Signature Modal */}
      {showSignatureModal && signingRental && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Digital Signature</h2>
              <p className="text-sm text-gray-600 mb-4">
                Rental ID: {signingRental._id}
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Name (Signature)
                  </label>
                  <input
                    type="text"
                    value={signatureData.clientSignature}
                    onChange={(e) => setSignatureData(prev => ({ ...prev, clientSignature: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type client name as signature"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    D4 Media Representative
                  </label>
                  <input
                    type="text"
                    value={signatureData.representativeSignature}
                    onChange={(e) => setSignatureData(prev => ({ ...prev, representativeSignature: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type representative name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Signature Date
                  </label>
                  <input
                    type="date"
                    value={signatureData.signedDate}
                    onChange={(e) => setSignatureData(prev => ({ ...prev, signedDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowSignatureModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSignature}
                  disabled={!signatureData.clientSignature || !signatureData.representativeSignature}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Save Signature
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingRental(null);
        }}
        onConfirm={handleDeleteRental}
        title="Delete Rental"
        message={`Are you sure you want to delete this rental${deletingRental ? ` for ${deletingRental.contactPerson?.name || 'this client'}` : ''}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

export default RentalManagement;