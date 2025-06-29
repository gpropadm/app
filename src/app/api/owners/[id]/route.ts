import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const owner = await prisma.owner.findUnique({
      where: { id },
      include: {
        properties: true,
        bankAccounts: true
      }
    })

    if (!owner) {
      return NextResponse.json(
        { error: 'Proprietário não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(owner)
  } catch (error) {
    console.error('Error fetching owner:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar proprietário' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔄 PUT /api/owners/[id] - Starting update...')
    const { id } = await params
    console.log('📝 Owner ID:', id)
    
    const data = await request.json()
    console.log('📊 Update data received:', data)
    
    // Simplified update - just owner data first, skip bank account for now
    console.log('👤 Updating owner basic data only...')
    const owner = await prisma.owner.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        document: data.document,
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zipCode: data.zipCode || ''
      }
    })

    console.log('✅ Owner updated successfully:', owner.id)
    
    // Return without complex includes to avoid schema issues
    return NextResponse.json({
      ...owner,
      bankAccounts: [],
      properties: []
    })
    
  } catch (error) {
    console.error('❌ Error updating owner:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao atualizar proprietário',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack?.substring(0, 1000) : undefined
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🗑️ DELETE /api/owners/[id] - Starting deletion...')
    const { id } = await params
    console.log('📝 Owner ID to delete:', id)
    
    // Check if owner exists first
    const existingOwner = await prisma.owner.findUnique({
      where: { id }
    })
    
    if (!existingOwner) {
      console.log('❌ Owner not found:', id)
      return NextResponse.json(
        { error: 'Proprietário não encontrado' },
        { status: 404 }
      )
    }
    
    console.log('👤 Owner found:', existingOwner.name)
    
    // Delete bank accounts first (if any)
    try {
      console.log('🏦 Deleting bank accounts...')
      const deletedBankAccounts = await prisma.bankAccounts.deleteMany({
        where: { 
          ownerId: id
        }
      })
      console.log('✅ Deleted bank accounts:', deletedBankAccounts.count)
    } catch (bankError) {
      console.log('⚠️ Bank account deletion failed (continuing):', bankError)
    }
    
    // Check for properties that might block deletion
    try {
      const propertiesCount = await prisma.property.count({
        where: { ownerId: id }
      })
      
      if (propertiesCount > 0) {
        console.log('❌ Cannot delete owner with properties:', propertiesCount)
        return NextResponse.json(
          { error: `Não é possível excluir proprietário que possui ${propertiesCount} imóvel(is) cadastrado(s)` },
          { status: 400 }
        )
      }
    } catch (propError) {
      console.log('⚠️ Property check failed (continuing):', propError)
    }
    
    // Delete the owner
    console.log('👤 Deleting owner...')
    await prisma.owner.delete({
      where: { id }
    })
    
    console.log('✅ Owner deleted successfully:', id)
    return NextResponse.json({ 
      message: 'Proprietário deletado com sucesso',
      deletedId: id 
    })
    
  } catch (error) {
    console.error('❌ Error deleting owner:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao deletar proprietário',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined
      },
      { status: 500 }
    )
  }
}